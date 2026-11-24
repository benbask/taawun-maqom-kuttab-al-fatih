import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ExportPanel } from "@/components/admin/export-panel";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Ekspor Data",
  robots: { index: false, follow: false },
};

export default async function AdminExportPage() {
  const settings = await getStore().getSettings();

  return (
    <div>
      <PageHeader
        eyebrow="Laporan"
        title="Ekspor data Ta'awun"
        description="Unduh seluruh transaksi untuk pelaporan atau kirim otomatis ke Google Sheets."
      />
      <ExportPanel configured={Boolean(settings.sheets_webhook_url)} />
    </div>
  );
}
