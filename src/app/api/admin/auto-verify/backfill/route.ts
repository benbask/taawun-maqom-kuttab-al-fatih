import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, requireAdminApi, sameOrigin } from "@/lib/api";
import { runAutoVerification } from "@/lib/auto-verify-service";
import { getStore } from "@/lib/store";

// OCR butuh waktu lebih dari batas default fungsi serverless.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { response } = await requireAdminApi();
  if (response) return response;

  try {
    const store = getStore();
    const all = await store.listAllInvoices({ includeDemo: false });
    const isPending = (invoice: (typeof all)[number]) =>
      invoice.status === "waiting_verification" &&
      Boolean(invoice.proof_url) &&
      !invoice.auto_verify_status;

    // Satu invoice per permintaan supaya tidak melewati batas waktu fungsi.
    // Halaman admin memanggil endpoint ini berulang sampai antrean habis.
    const [target] = all.filter(isPending);

    if (!target) {
      return apiOk({
        processed: 0,
        matched: 0,
        review: 0,
        skipped: 0,
        remaining: 0,
      });
    }

    const result = await runAutoVerification(target.id);
    const remaining = (await store.listAllInvoices({ includeDemo: false })).filter(
      isPending,
    ).length;

    revalidatePath("/admin/verifikasi");
    revalidatePath("/akun");
    revalidatePath("/");

    return apiOk({
      processed: 1,
      invoiceNo: target.invoice_no,
      matched: result.status === "matched" ? 1 : 0,
      review: result.status === "needs_review" ? 1 : 0,
      skipped: result.status === "skipped" ? 1 : 0,
      remaining,
    });
  } catch (error) {
    console.error("[admin/auto-verify/backfill]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal memproses antrean OCR.",
      500,
    );
  }
}
