import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WaPanel } from "@/components/admin/wa-panel";

export const metadata: Metadata = {
  title: "WhatsApp & OTP",
  robots: { index: false, follow: false },
};

export default function AdminWhatsappPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Pengaturan"
        title="WhatsApp & OTP"
        description="Pantau koneksi worker WhatsApp, pindai QR login, dan kirim kode OTP secara manual bila diperlukan."
      />
      <WaPanel />
    </div>
  );
}
