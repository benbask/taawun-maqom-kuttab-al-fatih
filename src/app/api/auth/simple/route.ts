import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, sameOrigin } from "@/lib/api";
import { isDemoPhone, resolvePhone } from "@/lib/demo";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { setUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { simpleLoginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);

  const ip = getClientIp(request);
  const ipLimit = rateLimit(`simple-login-ip:${ip}`, 20, 10 * 60 * 1000);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

  const body = await readJson(request);
  const parsed = simpleLoginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data masuk tidak valid.");
  }

  const phone = resolvePhone(parsed.data.phone);
  if (!phone) return apiError("Nomor WhatsApp tidak valid.");

  const phoneLimit = rateLimit(`simple-login:${phone}`, 6, 10 * 60 * 1000);
  if (!phoneLimit.allowed) return rateLimitResponse(phoneLimit);

  try {
    const store = getStore();
    let family =
      (await store.getFamilyByLinkedPhone(phone).catch(() => null)) ??
      (await store.getFamilyByPhone(phone).catch(() => null)) ??
      null;

    if (!family) {
      family = await store.createFamily({
        phone,
        parentName: "Calon peserta",
        consentAt: new Date().toISOString(),
        isDemo: isDemoPhone(phone),
      });
    }

    await setUserSession(phone, family.id);
    await store.addAuditLog({
      actorType: "user",
      actorId: phone,
      action: "simple_login",
      entityType: "family",
      entityId: family.id,
      metadata: { ip },
    });
    revalidatePath("/");
    revalidatePath("/daftar");

    return apiOk({
      phone,
      familyId: family.id,
      role: family.account_type ?? null,
      parentName: family.parent_name,
      demo: isDemoPhone(phone),
    });
  } catch (error) {
    console.error("[auth/simple]", error);
    return apiError("Gagal memproses nomor. Silakan coba lagi.", 500);
  }
}
