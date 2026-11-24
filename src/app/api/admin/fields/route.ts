import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, requireAdminApi, sameOrigin } from "@/lib/api";
import { getStore } from "@/lib/store";
import { formFieldSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  const body = await readJson(request);
  const parsed = formFieldSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data field tidak valid.");
  }
  if (parsed.data.type === "select" && !(parsed.data.options ?? []).length) {
    return apiError("Field pilihan wajib memiliki minimal satu opsi.");
  }

  try {
    const store = getStore();
    const record = await store.upsertFormField({
      ...parsed.data,
      id: parsed.data.id,
      label: parsed.data.label,
    });
    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: parsed.data.id ? "field_updated" : "field_created",
      entityType: "form_field",
      entityId: record.id,
      metadata: { scope: record.scope, key: record.key },
    });
    revalidatePath("/daftar");
    revalidatePath("/admin/form");
    return apiOk({ field: record });
  } catch (error) {
    console.error("[admin/fields]", error);
    return apiError("Gagal menyimpan field formulir.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return apiError("ID field wajib.");

  try {
    const store = getStore();
    await store.deleteFormField(id);
    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: "field_deactivated",
      entityType: "form_field",
      entityId: id,
    });
    revalidatePath("/daftar");
    revalidatePath("/admin/form");
    return apiOk({ deleted: true });
  } catch (error) {
    console.error("[admin/fields:delete]", error);
    return apiError("Gagal menonaktifkan field.", 500);
  }
}
