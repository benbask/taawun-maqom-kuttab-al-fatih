import type { NextRequest } from "next/server";
import { apiError, apiOk, readJson, sameOrigin } from "@/lib/api";
import { ensureDemoData, isDemoPhone, resolvePhone } from "@/lib/demo";
import { verifyOtp } from "@/lib/otp";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { setUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { otpVerifySchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);

  const body = await readJson(request);
  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Kode tidak valid.");
  }

  const phone = resolvePhone(parsed.data.phone);
  if (!phone) return apiError("Nomor WhatsApp tidak valid.");

  // Demo tidak dibatasi supaya bisa dicoba berkali-kali.
  if (!isDemoPhone(phone)) {
    const limit = rateLimit(`otp-verify:${getClientIp(request)}`, 25, 10 * 60 * 1000);
    if (!limit.allowed) return rateLimitResponse(limit);
  }

  try {
    const demo = isDemoPhone(phone);
    if (demo) await ensureDemoData();
    const result = await verifyOtp(phone, parsed.data.code);
    if (!result.ok) {
      return apiError(result.error, 400, {
        attemptsLeft: result.attemptsLeft,
      });
    }

    await setUserSession(phone, result.familyId);
    const family = result.familyId
      ? await getStore().getFamilyById(result.familyId)
      : null;
    const needsRole = !family?.account_type;

    return apiOk({
      phone,
      familyId: result.familyId,
      hasFamily: Boolean(result.familyId),
      needsRole,
      role: family?.account_type ?? null,
      demo,
    });
  } catch (error) {
    console.error("[otp/verify]", error);
    return apiError("Gagal memverifikasi kode. Silakan coba lagi.", 500);
  }
}
