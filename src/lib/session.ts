import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { isDemoPhone } from "@/lib/demo";
import { SESSION_SECRET } from "@/lib/env";

const userCookie = "taawun_user";
const adminCookie = "taawun_admin";
const secret = new TextEncoder().encode(SESSION_SECRET);

export interface UserSession {
  role: "user";
  phone: string;
  familyId: string | null;
  demo?: boolean;
}

export interface AdminSession {
  role: "admin";
  adminId: string;
  username: string;
  slot?: string | null;
  permissions?: string[] | null;
}

type SessionPayload = UserSession | AdminSession;

async function sign(payload: SessionPayload, maxAgeSeconds: number) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secret);
}

async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return payload as unknown as T;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function setUserSession(phone: string, familyId: string | null) {
  const token = await sign(
    { role: "user", phone, familyId, demo: isDemoPhone(phone) },
    60 * 60 * 24,
  );
  (await cookies()).set(userCookie, token, cookieOptions(60 * 60 * 24));
}

export async function getUserSession() {
  const token = (await cookies()).get(userCookie)?.value;
  const payload = await verify<UserSession>(token);
  return payload?.role === "user" ? payload : null;
}

export async function clearUserSession() {
  (await cookies()).delete(userCookie);
}

export async function requireUserPage() {
  const session = await getUserSession();
  if (!session) redirect("/daftar?masuk=1");
  return session;
}

export async function setAdminSession(
  adminId: string,
  username: string,
  access: { slot?: string | null; permissions?: string[] | null } = {},
) {
  const token = await sign(
    {
      role: "admin",
      adminId,
      username,
      slot: access.slot ?? null,
      permissions: access.permissions ?? null,
    },
    60 * 60 * 8,
  );
  (await cookies()).set(adminCookie, token, cookieOptions(60 * 60 * 8));
}

export async function getAdminSession() {
  const token = (await cookies()).get(adminCookie)?.value;
  const payload = await verify<AdminSession>(token);
  return payload?.role === "admin" ? payload : null;
}

export async function clearAdminSession() {
  (await cookies()).delete(adminCookie);
}

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
