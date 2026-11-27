import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  hasPermission,
  isPublicAdminPath,
  requiredPermission,
} from "@/lib/admin-permissions";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "taawun-dev-secret-change-me-in-production",
);

/**
 * Menjaga halaman dan API admin sesuai hak akses tiap slot.
 * Sesi lama tanpa daftar hak tetap dianggap super admin.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/admin");

  if (isPublicAdminPath(pathname)) return NextResponse.next();

  const denyApi = (message: string, status: number) =>
    NextResponse.json({ ok: false, error: message }, { status });

  const token = request.cookies.get("taawun_admin")?.value;
  if (!token) {
    if (isApi) return denyApi("Sesi admin tidak valid.", 401);
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  let permissions: string[] | null | undefined;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (payload.role !== "admin") throw new Error("Bukan admin.");
    permissions = payload.permissions as string[] | null | undefined;
  } catch {
    if (isApi) return denyApi("Sesi admin tidak valid.", 401);
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  const needed = requiredPermission(pathname);
  if (needed && !hasPermission(permissions, needed)) {
    if (isApi) return denyApi("Akun Anda tidak memiliki akses ke menu ini.", 403);
    const url = request.nextUrl.clone();
    url.pathname = "/admin/akses-ditolak";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

