import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, requireAdminApi, sameOrigin } from "@/lib/api";
import { pushToSheets } from "@/lib/sheets";
import { getStore } from "@/lib/store";
import { verifyInvoiceSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  const { id } = await context.params;
  const body = await readJson(request);
  const parsed = verifyInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data verifikasi tidak valid.");
  }

  try {
    const store = getStore();
    const invoice = await store.getInvoiceById(id);
    if (!invoice) return apiError("Invoice tidak ditemukan.", 404);

    if (parsed.data.status === "rejected" && !parsed.data.reason?.trim()) {
      return apiError("Alasan penolakan wajib diisi.");
    }

    await store.verifyInvoice(
      id,
      parsed.data.status,
      session.adminId,
      parsed.data.reason ?? null,
    );

    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: `invoice_${parsed.data.status}`,
      entityType: "invoice",
      entityId: id,
      metadata: {
        invoiceNo: invoice.invoice_no,
        reason: parsed.data.reason ?? null,
        total: invoice.total_amount,
      },
    });

    let sheets: { ok: boolean; error?: string } | null = null;
    if (parsed.data.status === "verified") {
      const settings = await store.getSettings();
      if (settings.sheets_webhook_url) {
        const updated = await store.getInvoiceById(id);
        if (updated) {
          sheets = await pushToSheets(settings, [updated]);
          await store.addAuditLog({
            actorType: "system",
            action: sheets.ok ? "sheets_synced" : "sheets_sync_failed",
            entityType: "invoice",
            entityId: id,
            metadata: { error: sheets.error ?? null },
          });
        }
      }
    }

    revalidatePath("/");
    revalidatePath("/verifikasi");
    revalidatePath("/akun");
    revalidatePath(`/invoice/${id}`);
    revalidatePath("/admin");
    revalidatePath("/admin/verifikasi");

    return apiOk({ status: parsed.data.status, sheets });
  } catch (error) {
    console.error("[admin/verify]", error);
    return apiError("Gagal memverifikasi invoice.", 500);
  }
}
