import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, requireUserApi, sameOrigin } from "@/lib/api";
import { getStore } from "@/lib/store";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireUserApi();
  if (!session) return response;

  const { id } = await context.params;

  try {
    const store = getStore();
    const invoice = await store.getInvoiceById(id);
    if (!invoice) return apiError("Invoice tidak ditemukan.", 404);

    const familyId =
      session.familyId ?? (await store.getFamilyByPhone(session.phone))?.id ?? null;
    if (!familyId || invoice.family_id !== familyId) {
      return apiError("Anda tidak berhak mengunggah bukti untuk invoice ini.", 403);
    }
    if (invoice.status === "verified") {
      return apiError("Invoice ini sudah terverifikasi.", 409);
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return apiError("Pilih file bukti transfer terlebih dahulu.");
    }

    const uploaded = await store.uploadProof({ invoiceId: id, file });
    const uploadedAt = new Date().toISOString();
    await store.setInvoiceProof(id, uploaded.url, uploadedAt);
    await store.addAuditLog({
      actorType: "user",
      actorId: session.phone,
      action: "proof_uploaded",
      entityType: "invoice",
      entityId: id,
      metadata: { size: file.size, type: file.type },
    });

    revalidatePath(`/invoice/${id}`);
    revalidatePath("/akun");
    revalidatePath("/admin/verifikasi");

    return apiOk({ uploadedAt, status: "waiting_verification" });
  } catch (error) {
    console.error("[invoice/proof]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal mengunggah bukti transfer.",
      500,
    );
  }
}
