import type { NextRequest } from "next/server";
import { apiError, apiOk, readJson, requireAdminApi, sameOrigin } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { getStore } from "@/lib/store";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib."),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter.").max(200),
});

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  const body = await readJson(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const store = getStore();
    const admin = await store.getAdminById(session.adminId);
    if (!admin) return apiError("Akun admin tidak ditemukan.", 404);

    const valid = await verifyPassword(parsed.data.currentPassword, admin.password_hash);
    if (!valid) return apiError("Password saat ini salah.", 400);

    await store.updateAdminPassword(admin.id, await hashPassword(parsed.data.newPassword));
    await store.addAuditLog({
      actorType: "admin",
      actorId: admin.id,
      action: "admin_password_changed",
    });

    return apiOk({ updated: true });
  } catch (error) {
    console.error("[admin/account]", error);
    return apiError("Gagal mengubah password.", 500);
  }
}
