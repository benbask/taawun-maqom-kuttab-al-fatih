import "server-only";
import type { NextRequest } from "next/server";
import { getAdminSession, getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { NoUniqueCodeError } from "@/lib/unique-code";

export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, error: message, ...extra }, { status });
}

export function apiOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return Response.json({ ok: true, ...data }, { status });
}

export async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, response: apiError("Sesi admin tidak valid.", 401) };
  }
  // Akun yang dinonaktifkan langsung kehilangan akses API.
  const admin = await getStore().getAdminById(session.adminId).catch(() => null);
  if (!admin || admin.is_active === false) {
    return { session: null, response: apiError("Akun admin tidak aktif.", 401) };
  }
  return {
    session: { ...session, permissions: admin.permissions },
    response: null,
  };
}

export async function requireUserApi() {
  const session = await getUserSession();
  if (!session) {
    return { session: null, response: apiError("Silakan masuk terlebih dahulu.", 401) };
  }
  return { session, response: null };
}

export function handleApiError(error: unknown) {
  if (error instanceof NoUniqueCodeError) {
    return apiError(error.message, 409);
  }
  const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
  console.error("[api]", error);
  return apiError(message, 500);
}
