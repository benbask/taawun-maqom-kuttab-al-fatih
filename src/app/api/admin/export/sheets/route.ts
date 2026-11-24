import type { NextRequest } from "next/server";
import { apiError, apiOk, requireAdminApi, sameOrigin } from "@/lib/api";
import { buildSheetsPayload } from "@/lib/sheets";
import { getStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  try {
    const store = getStore();
    const settings = await store.getSettings();
    if (!settings.sheets_webhook_url) {
      return apiError(
        "Atur URL webhook Google Sheets terlebih dahulu di menu QRIS & Pengaturan.",
      );
    }

    const invoices = await store.listAllInvoices();
    const payload = buildSheetsPayload(invoices, settings.sheets_webhook_secret);

    const webhook = await fetch(settings.sheets_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    if (!webhook.ok) {
      return apiError(`Webhook menolak permintaan (${webhook.status}).`, 502);
    }

    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: "sheets_exported",
      metadata: { invoices: invoices.length },
    });

    return apiOk({ sent: invoices.length, rows: payload.rows.length });
  } catch (error) {
    console.error("[admin/export/sheets]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal mengirim ke Google Sheets.",
      500,
    );
  }
}
