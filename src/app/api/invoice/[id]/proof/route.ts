import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, sameOrigin } from "@/lib/api";
import { evaluateAutoVerify } from "@/lib/auto-verify-core";
import { recognizeProof } from "@/lib/auto-verify";
import { getAdminSession, getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

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

    let autoVerify: "matched" | "needs_review" | "skipped" | null = null;
    if (!invoice.is_demo) {
      const checkedAt = new Date().toISOString();
      if (!file.type.startsWith("image/")) {
        autoVerify = "skipped";
        await store.setAutoVerifyResult(id, {
          status: "skipped",
          amount: null,
          at: checkedAt,
        });
        await store.addAuditLog({
          actorType: "system",
          actorId: "auto-ocr",
          action: "auto_verify_skipped",
          entityType: "invoice",
          entityId: id,
          metadata: { reason: "Format bukan gambar." },
        });
      } else {
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const { text, confidence } = await recognizeProof(bytes);
          const result = evaluateAutoVerify({
            text,
            confidence,
            expectedAmount: invoice.total_amount,
          });
          autoVerify = result.status;
          await store.setAutoVerifyResult(id, {
            status: result.status,
            amount: result.amount,
            at: checkedAt,
          });

          await store.addAuditLog({
            actorType: "system",
            actorId: "auto-ocr",
            action:
              result.status === "matched" ? "auto_verified" : "auto_verify_review",
            entityType: "invoice",
            entityId: id,
            metadata: {
              detectedAmount: result.amount,
              expectedAmount: invoice.total_amount,
              confidence,
              reason: result.reason ?? null,
            },
          });

          if (result.status === "matched") {
            await store.verifyInvoice(id, "verified", "auto-ocr");
          }
        } catch (error) {
          console.error("[invoice/proof:auto]", error);
          autoVerify = "skipped";
          await store.setAutoVerifyResult(id, {
            status: "skipped",
            amount: null,
            at: checkedAt,
          });
          await store.addAuditLog({
            actorType: "system",
            actorId: "auto-ocr",
            action: "auto_verify_failed",
            entityType: "invoice",
            entityId: id,
            metadata: {
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }
    }

    revalidatePath(`/invoice/${id}`);
    revalidatePath("/akun");
    revalidatePath("/admin/verifikasi");

    return apiOk({
      uploadedAt,
      status: autoVerify === "matched" ? "verified" : "waiting_verification",
      autoVerify,
    });
  } catch (error) {
    console.error("[invoice/proof]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal mengunggah bukti transfer.",
      500,
    );
  }
}
