import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} wajib diisi.`);
  return value;
}

export const config = {
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  otpSecret: required("OTP_ENCRYPTION_KEY"),
  authDir: path.resolve(process.cwd(), process.env.AUTH_DIR ?? "./auth_info"),
  otpTemplate:
    process.env.OTP_TEMPLATE ??
    "Kode verifikasi Ta'awun Maqom Kuttab Al Fatih Lampung: {{kode}}. Berlaku {{menit}} menit. Jangan bagikan kode ini kepada siapa pun.",
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES ?? 10),
  heartbeatIntervalMs: Number(process.env.HEARTBEAT_INTERVAL_MS ?? 30_000),
  otpPollIntervalMs: Number(process.env.OTP_POLL_INTERVAL_MS ?? 3_000),
  logLevel: process.env.LOG_LEVEL ?? "info",
};
