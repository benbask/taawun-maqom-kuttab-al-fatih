import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { SESSION_SECRET } from "@/lib/env";
import type { GoogleIdentity } from "@/lib/types";

const cookieName = "taawun_google_pending";
const maxAge = 10 * 60;
const secret = new TextEncoder().encode(SESSION_SECRET);

export async function setPendingGoogle(identity: GoogleIdentity) {
  const token = await new SignJWT({ ...identity, kind: "google_pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret);

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function getPendingGoogle(): Promise<GoogleIdentity | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (payload.kind !== "google_pending" || typeof payload.sub !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
      emailVerified: payload.email_verified === true,
    };
  } catch {
    return null;
  }
}

export async function clearPendingGoogle() {
  (await cookies()).delete(cookieName);
}
