import type { NextRequest } from "next/server";
import { apiError, apiOk, readJson, sameOrigin } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { setAdminSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { adminLoginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);

  const limit = rateLimit(`admin-login:${getClientIp(request)}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await readJson(request);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const store = getStore();
    const admin = await store.getAdminByUsername(parsed.data.username);
    const generic = "Username atau password salah.";

    if (!admin) {
      // Tetap jalankan hash agar waktu respons tidak membocorkan keberadaan akun.
      await verifyPassword(parsed.data.password, await hashPassword("dummy-password"));
      return apiError(generic, 401);
    }

    const valid = await verifyPassword(parsed.data.password, admin.password_hash);
    if (!valid || admin.is_active === false) return apiError(generic, 401);

    await store.updateAdminLogin(admin.id);
    await store.addAuditLog({
      actorType: "admin",
      actorId: admin.id,
      action: "admin_login",
      metadata: { slot: admin.slot ?? null },
    });
    await setAdminSession(admin.id, admin.username, {
      slot: admin.slot,
      permissions: admin.permissions,
    });

    return apiOk({ username: admin.username });
  } catch (error) {
    console.error("[admin/login]", error);
    return apiError("Gagal masuk. Silakan coba lagi.", 500);
  }
}
