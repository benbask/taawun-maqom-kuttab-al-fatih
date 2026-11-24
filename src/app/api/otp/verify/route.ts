import type { NextRequest } from "next/server";
import { apiError, apiOk, readJson, sameOrigin } from "@/lib/api";
import { ensureDemoData, isDemoPhone, resolvePhone } from "@/lib/demo";
import { verifyOtp } from "@/lib/otp";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { setUserSession } from "@/lib/session";
import { otpVerifySchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);

  const ip = getClientIp(request);
  const limit = rateLimit(`otp-verify:${ip}`, 25, 10 * 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await readJson(request);
  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Kode tidak valid.");
  }

  const phone = resolvePhone(parsed.data.phone);
  if (!phone) return apiError("Nomor WhatsApp tidak valid.");

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
    return apiOk({
      phone,
      familyId: result.familyId,
      hasFamily: Boolean(result.familyId),
      demo,
    });
  } catch (error) {
    console.error("[otp/verify]", error);
    return apiError("Gagal memverifikasi kode. Silakan coba lagi.", 500);
  }
}
