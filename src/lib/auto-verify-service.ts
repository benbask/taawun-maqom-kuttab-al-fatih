import "server-only";
import {
  evaluateAutoVerify,
  type AutoVerifyStatus,
} from "@/lib/auto-verify-core";
import { recognizeProof } from "@/lib/auto-verify";
import { getStore } from "@/lib/store";

export interface AutoVerifyOutcome {
  status: AutoVerifyStatus;
  amount: number | null;
  confidence?: number;
  reason?: string;
  verified: boolean;
}

/**
 * Menjalankan pemeriksaan OCR untuk satu invoice dan menyimpan hasilnya.
 * Bisa dipakai saat upload maupun untuk memproses antrean lama.
 */
export async function runAutoVerification(
  invoiceId: string,
  source?: { bytes: Uint8Array; type: string },
): Promise<AutoVerifyOutcome> {
  const store = getStore();
  const invoice = await store.getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Invoice tidak ditemukan.");

  if (invoice.is_demo) {
    return {
      status: "skipped",
      amount: null,
      verified: false,
      reason: "Data demo dilewati.",
    };
  }

  if (invoice.status === "verified") {
    return {
      status: "matched",
      amount: invoice.total_amount,
      verified: true,
      reason: "Invoice sudah terverifikasi.",
    };
  }

  const checkedAt = new Date().toISOString();

  try {
    const proof = source ?? (await store.downloadProof(invoiceId));

    if (!proof.type.startsWith("image/")) {
      await store.setAutoVerifyResult(invoiceId, {
        status: "skipped",
        amount: null,
        at: checkedAt,
      });
      await store.addAuditLog({
        actorType: "system",
        actorId: "auto-ocr",
        action: "auto_verify_skipped",
        entityType: "invoice",
        entityId: invoiceId,
        metadata: { reason: "Format bukan gambar." },
      });
      return {
        status: "skipped",
        amount: null,
        verified: false,
        reason: "Format bukan gambar.",
      };
    }

    const { text, confidence } = await recognizeProof(proof.bytes);
    const result = evaluateAutoVerify({
      text,
      confidence,
      expectedAmount: invoice.total_amount,
    });

    await store.setAutoVerifyResult(invoiceId, {
      status: result.status,
      amount: result.amount,
      at: checkedAt,
    });

    await store.addAuditLog({
      actorType: "system",
      actorId: "auto-ocr",
      action: result.status === "matched" ? "auto_verified" : "auto_verify_review",
      entityType: "invoice",
      entityId: invoiceId,
      metadata: {
        detectedAmount: result.amount,
        expectedAmount: invoice.total_amount,
        confidence,
        reason: result.reason ?? null,
      },
    });

    if (result.status === "matched") {
      await store.verifyInvoice(invoiceId, "verified", "auto-ocr");
    }

    return {
      status: result.status,
      amount: result.amount,
      confidence,
      reason: result.reason,
      verified: result.status === "matched",
    };
  } catch (error) {
    console.error("[auto-verify]", error);
    await store.setAutoVerifyResult(invoiceId, {
      status: "skipped",
      amount: null,
      at: checkedAt,
    });
    await store.addAuditLog({
      actorType: "system",
      actorId: "auto-ocr",
      action: "auto_verify_failed",
      entityType: "invoice",
      entityId: invoiceId,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return {
      status: "skipped",
      amount: null,
      verified: false,
      reason: error instanceof Error ? error.message : "OCR gagal.",
    };
  }
}
