import "server-only";
import { appUrl } from "@/lib/env";
import { createOcrToken } from "@/lib/ocr-token";

export interface RemoteAutoVerifyResult {
  status: "matched" | "needs_review" | "skipped";
  amount: number | null;
  confidence?: number;
  reason?: string;
  verified: boolean;
}

/**
 * Meminta layanan OCR memeriksa satu invoice. Dijalankan lewat route statis
 * supaya file runtime Tesseract ikut ter-deploy.
 */
export async function requestAutoVerification(
  invoiceId: string,
): Promise<RemoteAutoVerifyResult> {
  const { expires, signature } = createOcrToken(invoiceId);
  const base = appUrl.replace(/\/$/, "");

  const response = await fetch(`${base}/api/ocr/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ invoiceId, expires, signature }),
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
  });

  let data: { ok?: boolean; error?: string } & Partial<RemoteAutoVerifyResult>;
  try {
    data = (await response.json()) as typeof data;
  } catch {
    throw new Error("Layanan OCR tidak merespons.");
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "Layanan OCR gagal memeriksa bukti.");
  }

  return {
    status: data.status ?? "skipped",
    amount: data.amount ?? null,
    confidence: data.confidence,
    reason: data.reason,
    verified: Boolean(data.verified),
  };
}
