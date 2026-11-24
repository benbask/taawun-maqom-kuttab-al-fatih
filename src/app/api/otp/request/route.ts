import type { NextRequest } from "next/server";
import { apiError, apiOk, readJson, sameOrigin } from "@/lib/api";
import { isDemoPhone, resolvePhone } from "@/lib/demo";
import { waLink } from "@/lib/format";
import { requestOtp } from "@/lib/otp";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getStore } from "@/lib/store";
import { otpRequestSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);

  const ip = getClientIp(request);
  const ipLimit = rateLimit(`otp-request:${ip}`, 10, 10 * 60 * 1000);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

  const body = await readJson(request);
  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Nomor tidak valid.");
  }

  const phone = resolvePhone(parsed.data.phone);
  if (!phone) {
    return apiError(
      "Nomor WhatsApp tidak valid. Gunakan format 08xx atau 62xx.",
    );
  }

  const phoneLimit = rateLimit(`otp-phone:${phone}`, 3, 10 * 60 * 1000);
  if (!phoneLimit.allowed) return rateLimitResponse(phoneLimit);

  try {
    const result = await requestOtp(phone, ip);
    const settings = await getStore().getSettings();

    return apiOk({
      phone,
      expiresAt: result.expiresAt,
      expiresInMinutes: settings.otp_expiry_minutes,
      workerOnline: result.workerOnline,
      demoCode: result.demoCode,
      manualUrl:
        !result.workerOnline && settings.admin_whatsapp
          ? waLink(
              settings.admin_whatsapp,
              `Assalamu'alaikum admin, saya sudah meminta kode OTP Ta'awun untuk nomor ${phone}, tetapi belum menerimanya. Mohon dibantu.`,
            )
          : null,
      message: isDemoPhone(phone)
        ? "Mode demo aktif. Gunakan kode 8888."
        : result.workerOnline || result.demoCode
          ? "Kode OTP sedang dikirim melalui WhatsApp."
          : "Kode OTP dibuat. Worker WhatsApp sedang offline, admin akan mengirimkannya secara manual.",
    });
  } catch (error) {
    console.error("[otp/request]", error);
    return apiError("Gagal membuat kode OTP. Silakan coba lagi.", 500);
  }
}
