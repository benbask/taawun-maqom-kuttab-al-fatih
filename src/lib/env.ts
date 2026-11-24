import "server-only";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceKey);

export const isDemoMode =
  process.env.DEMO_MODE === "true" || !isSupabaseConfigured;

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "taawun-dev-secret-change-me-in-production";

export const OTP_SECRET =
  process.env.OTP_ENCRYPTION_KEY ?? `${SESSION_SECRET}:otp`;

export const DEMO_ADMIN_USERNAME = process.env.DEMO_ADMIN_USERNAME ?? "admin";
export const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "Taawun123!";

export const UPLOAD_MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES ?? 3 * 1024 * 1024);

export function assertProductionSecrets() {
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    console.warn(
      "[taawun] SESSION_SECRET belum diisi. Jangan gunakan nilai default di production.",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.OTP_ENCRYPTION_KEY
  ) {
    console.warn(
      "[taawun] OTP_ENCRYPTION_KEY belum diisi. Kode OTP memakai turunan SESSION_SECRET.",
    );
  }
}
