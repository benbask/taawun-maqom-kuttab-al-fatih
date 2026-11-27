import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk } from "@/lib/api";
import { runAutoVerification } from "@/lib/auto-verify-service";
import { verifyOcrToken } from "@/lib/ocr-token";

// OCR memerlukan waktu lebih dari batas default fungsi serverless.
export const maxDuration = 60;

interface OcrRequest {
  invoiceId?: string;
  expires?: number;
  signature?: string;
}

/**
 * Layanan OCR internal. Hanya bisa dipanggil dengan token bertanda tangan
 * yang dibuat oleh route lain di server ini.
 */
export async function POST(request: NextRequest) {
  let body: OcrRequest | null = null;

  try {
    body = (await request.json()) as OcrRequest;
  } catch {
    return apiError("Permintaan tidak valid.", 400);
  }

  const invoiceId = body?.invoiceId;
  const expires = Number(body?.expires);
  const signature = body?.signature;

  if (
    !invoiceId ||
    typeof signature !== "string" ||
    !verifyOcrToken({ invoiceId, expires, signature })
  ) {
    return apiError("Permintaan tidak valid.", 403);
  }

  try {
    const result = await runAutoVerification(invoiceId);
    revalidatePath(`/invoice/${invoiceId}`);
    revalidatePath("/admin/verifikasi");
    revalidatePath("/akun");
    return apiOk({ ...result });
  } catch (error) {
    console.error("[ocr/run]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal memeriksa bukti.",
      500,
    );
  }
}
