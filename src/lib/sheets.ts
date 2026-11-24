import "server-only";
import { invoiceExportRows } from "@/lib/export";
import type { InvoiceWithDetails, Settings } from "@/lib/types";

export interface SheetsPayload {
  secret?: string;
  sheet: string;
  generatedAt: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export function buildSheetsPayload(
  invoices: InvoiceWithDetails[],
  secret?: string | null,
): SheetsPayload {
  const data = invoiceExportRows(invoices);
  const keys = data.length ? Object.keys(data[0]) : [];
  const headers = keys.map((key) =>
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  );
  return {
    secret: secret ?? undefined,
    sheet: "Taawun",
    generatedAt: new Date().toISOString(),
    headers,
    rows: data.map((row) => keys.map((key) => row[key as keyof typeof row] ?? "")),
  };
}

export async function pushToSheets(
  settings: Settings,
  invoices: InvoiceWithDetails[],
): Promise<{ ok: boolean; error?: string }> {
  if (!settings.sheets_webhook_url) {
    return { ok: false, error: "Webhook Google Sheets belum diatur." };
  }

  try {
    const response = await fetch(settings.sheets_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildSheetsPayload(invoices, settings.sheets_webhook_secret),
      ),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return { ok: false, error: `Webhook menolak permintaan (${response.status}).` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal menghubungi webhook.",
    };
  }
}
