import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, requireAdminApi, sameOrigin } from "@/lib/api";
import { getStore } from "@/lib/store";
import { classSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  const body = await readJson(request);
  const parsed = classSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data kelas tidak valid.");
  }

  try {
    const store = getStore();
    const record = await store.upsertClass(parsed.data);
    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: parsed.data.id ? "class_updated" : "class_created",
      entityType: "class",
      entityId: record.id,
      metadata: { name: record.name },
    });
    revalidatePath("/");
    revalidatePath("/daftar");
    revalidatePath("/verifikasi");
    revalidatePath("/admin/kelas");
    return apiOk({ class: record });
  } catch (error) {
    console.error("[admin/classes]", error);
    return apiError("Gagal menyimpan kelas.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return apiError("ID kelas wajib.");

  try {
    const store = getStore();
    await store.deleteClass(id);
    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: "class_deactivated",
      entityType: "class",
      entityId: id,
    });
    revalidatePath("/");
    revalidatePath("/daftar");
    revalidatePath("/admin/kelas");
    return apiOk({ deleted: true });
  } catch (error) {
    console.error("[admin/classes:delete]", error);
    return apiError("Gagal menonaktifkan kelas.", 500);
  }
}
