import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  GOOGLE_ISSUERS,
  googleIdentityFromPayload,
} from "@/lib/google-identity";
import type { GoogleIdentity } from "@/lib/types";

export { googleIdentityFromPayload };

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function isGoogleSignInEnabled() {
  return GOOGLE_CLIENT_ID.trim().length > 0;
}

const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export async function verifyGoogleIdToken(
  credential: string,
): Promise<GoogleIdentity | null> {
  if (!isGoogleSignInEnabled()) return null;

  try {
    const { payload } = await jwtVerify(credential, jwks, {
      algorithms: ["RS256"],
      audience: GOOGLE_CLIENT_ID,
      issuer: [...GOOGLE_ISSUERS],
      clockTolerance: 5,
    });
    return googleIdentityFromPayload(payload, GOOGLE_CLIENT_ID);
  } catch (error) {
    console.warn("[google] token ditolak:", error);
    return null;
  }
}
