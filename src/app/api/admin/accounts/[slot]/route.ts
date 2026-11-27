import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, requireAdminApi, sameOrigin } from "@/lib/api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { hashPassword } from "@/lib/crypto";
import { getStore } from "@/lib/store";
import { z } from "zod";

const slots = [
  "super_admin",
  "code_harnes",
  "bendahara_1",
  "bendahara_2",
  "asisten",
] as const;

const schema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter.")
    .max(50, "Username maksimal 50 karakter.")
    .regex(/^[a-z0-9_.-]+$/i, "Username hanya huruf, angka, titik, dan garis bawah."),
  isActive: z.boolean(),
  permissions: z.array(z.enum(ADMIN_PERMISSIONS)),
  password: z.string().min(8, "Password minimal 8 karakter.").max(200).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slot: string }> },
) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  if (session.slot !== "super_admin") {
    return apiError("Hanya super admin yang dapat mengubah akun admin.", 403);
  }

  const { slot } = await context.params;
  if (!slots.includes(slot as (typeof slots)[number])) {
    return apiError("Slot admin tidak dikenal.", 404);
  }

  const body = await readJson(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const store = getStore();
    const admins = await store.listAdmins();
    const target = admins.find((admin) => admin.slot === slot);
    if (!target) return apiError("Akun admin tidak ditemukan.", 404);

    const { password, ...access } = parsed.data;

    // Akun yang baru diaktifkan wajib mendapat password baru.
    if (!target.is_active && access.isActive && !password) {
      return apiError("Isi password baru sebelum mengaktifkan akun ini.", 400);
    }

    // Jangan sampai tidak ada super admin aktif.
    if (
      slot === "super_admin" &&
      (!access.isActive ||
        !access.permissions.includes("akun") ||
        !access.permissions.includes("audit"))
    ) {
      return apiError(
        "Super admin harus aktif dan tetap memiliki akses Akun Admin serta Audit Log.",
        400,
      );
    }

    await store.updateAdminSlot({
      id: target.id,
      username: access.username,
      isActive: access.isActive,
      permissions: access.permissions,
      passwordHash: password ? await hashPassword(password) : undefined,
    });

    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: password ? "admin_credentials_updated" : "admin_access_updated",
      entityType: "admin",
      entityId: target.id,
      metadata: {
        slot,
        isActive: access.isActive,
        permissions: access.permissions,
      },
    });

    revalidatePath("/admin/akun");
    return apiOk({ updated: true });
  } catch (error) {
    console.error("[admin/accounts]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal menyimpan akun admin.",
      500,
    );
  }
}
