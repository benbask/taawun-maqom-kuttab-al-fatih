import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, sameOrigin } from "@/lib/api";
import { requestAutoVerification } from "@/lib/ocr-remote";
import { getAdminSession, getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

// Unggah + OCR memerlukan waktu lebih dari batas default fungsi serverless.
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const [user, admin] = await Promise.all([getUserSession(), getAdminSession()]);
  if (!user && !admin) return apiError("Masuk terlebih dahulu.", 401);

  const { id } = await context.params;

  try {
    const store = getStore();
    const invoice = await store.getInvoiceById(id);
    if (!invoice) return apiError("Invoice tidak ditemukan.", 404);

    const familyId = user
      ? user.familyId ?? (await store.getFamilyByPhone(user.phone))?.id ?? null
      : null;
    if (!admin && (!familyId || invoice.family_id !== familyId)) {
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
      actorType: admin ? "admin" : "user",
      actorId: admin ? admin.adminId : user?.phone ?? null,
      action: "proof_uploaded",
      entityType: "invoice",
      entityId: id,
      metadata: { size: file.size, type: file.type },
    });

    const auto = invoice.is_demo
      ? null
      : await requestAutoVerification(id).catch((error) => {
          console.error("[invoice/proof:auto]", error);
          return null;
        });

    revalidatePath(`/invoice/${id}`);
    revalidatePath("/akun");
    revalidatePath("/admin/verifikasi");

    return apiOk({
      uploadedAt,
      status: auto?.verified ? "verified" : "waiting_verification",
      autoVerify: auto?.status ?? null,
    });
  } catch (error) {
    console.error("[invoice/proof]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal mengunggah bukti transfer.",
      500,
    );
  }
}
