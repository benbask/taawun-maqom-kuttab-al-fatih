import type { JWTPayload } from "jose";
import type { GoogleIdentity } from "@/lib/types";

export const GOOGLE_ISSUERS = new Set([
  "https://accounts.google.com",
  "accounts.google.com",
]);

/** Memetakan claim ID token Google menjadi identitas internal. */
export function googleIdentityFromPayload(
  payload: JWTPayload,
  clientId: string,
): GoogleIdentity | null {
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub) return null;
  if (typeof payload.iss !== "string" || !GOOGLE_ISSUERS.has(payload.iss)) return null;
  if (payload.aud !== clientId) return null;
  if (payload.exp === undefined || payload.exp * 1000 < Date.now()) return null;

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
  const emailVerified = payload.email_verified === true;

  return {
    sub,
    email: emailVerified ? email : null,
    name: typeof payload.name === "string" ? payload.name : null,
    emailVerified,
  };
}
