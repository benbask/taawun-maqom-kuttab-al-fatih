import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, requireAdminApi, sameOrigin } from "@/lib/api";
import { runAutoVerification } from "@/lib/auto-verify-service";
import { getStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { response } = await requireAdminApi();
  if (response) return response;

  try {
    const requested = Number(new URL(request.url).searchParams.get("limit") ?? 5);
    const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 5, 1), 10);

    const store = getStore();
    const all = await store.listAllInvoices({ includeDemo: false });
    const isPending = (invoice: (typeof all)[number]) =>
      invoice.status === "waiting_verification" &&
      Boolean(invoice.proof_url) &&
      invoice.auto_verify_status !== "matched";

    const targets = all.filter(isPending).slice(0, limit);
    let matched = 0;
    let review = 0;
    let skipped = 0;

    for (const invoice of targets) {
      const result = await runAutoVerification(invoice.id);
      if (result.status === "matched") matched += 1;
      else if (result.status === "needs_review") review += 1;
      else skipped += 1;
    }

    const remaining = (await store.listAllInvoices({ includeDemo: false })).filter(
      isPending,
    ).length;

    revalidatePath("/admin/verifikasi");
    revalidatePath("/akun");
    revalidatePath("/");

    return apiOk({
      processed: targets.length,
      matched,
      review,
      skipped,
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
