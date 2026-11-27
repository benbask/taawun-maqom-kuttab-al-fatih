import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, requireAdminApi, sameOrigin } from "@/lib/api";
import { requestAutoVerification } from "@/lib/ocr-remote";

// OCR memerlukan waktu lebih dari batas default fungsi serverless.
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await context.params;

  try {
    const result = await requestAutoVerification(id);
    revalidatePath("/admin/verifikasi");
    revalidatePath(`/invoice/${id}`);
    revalidatePath("/akun");
    return apiOk({ ...result });
  } catch (error) {
    console.error("[admin/auto-verify]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal memeriksa bukti.",
      500,
    );
  }
}
