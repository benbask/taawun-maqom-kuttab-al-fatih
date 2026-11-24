import crypto from "node:crypto";
import { config } from "./config.js";

function otpKey() {
  return crypto.createHash("sha256").update(config.otpSecret).digest();
}

/** Dékripsi kode OTP yang dibuat aplikasi web (AES-256-GCM). */
export function decryptOtp(payload: string): string | null {
  try {
    const [ivText, tagText, dataText] = payload.split(".");
    if (!ivText || !tagText || !dataText) return null;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      otpKey(),
      Buffer.from(ivText, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function renderOtpMessage(code: string) {
  return config.otpTemplate
    .replaceAll("{{kode}}", code)
    .replaceAll("{{kode_otp}}", code)
    .replaceAll("{{menit}}", String(config.otpExpiryMinutes));
}
