import type { NextRequest } from "next/server";
import { apiError, apiOk, readJson, sameOrigin } from "@/lib/api";
import { hashPassword } from "@/lib/crypto";
import { setAdminSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { adminSetupSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);

  const store = getStore();
  const count = await store.getAdminCount().catch(() => 0);
  if (count > 0) {
    return apiError("Admin sudah pernah dibuat. Silakan masuk.", 403);
  }

  const body = await readJson(request);
  const parsed = adminSetupSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const admin = await store.createAdmin(parsed.data.username, passwordHash);
    await store.addAuditLog({
      actorType: "admin",
      actorId: admin.id,
      action: "admin_setup",
    });
    await setAdminSession(admin.id, admin.username);
    return apiOk({ username: admin.username });
  } catch (error) {
    console.error("[admin/setup]", error);
    return apiError("Gagal membuat akun admin. Silakan coba lagi.", 500);
  }
}
