import type { Metadata } from "next";
import Link from "next/link";
import { FileSpreadsheet, Info, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { QrisPayloadField } from "@/components/admin/qris-payload-field";
import { SettingsForm } from "@/components/admin/settings-form";
import { formatPhone } from "@/lib/format";
import { qrDataUrl } from "@/lib/qr-image";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "QRIS & Pengaturan",
  robots: { index: false, follow: false },
};

export default async function AdminQrisPage() {
  const settings = await getStore().getSettings();
  const qr = settings.qris_payload
    ? await qrDataUrl(settings.qris_payload).catch(() => null)
    : null;

  return (
    <div>
      <PageHeader
        eyebrow="Pembayaran"
        title="QRIS & pengaturan sistem"
        description="Unggah payload QRIS statis, kode unik audit, OTP, dan integrasi Google Sheets."
        actions={
          <Link href="/admin/export" className={buttonClasses("outline", "sm")}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> Ekspor data
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="p-5">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="text-xs leading-relaxed text-stone-600">
              <p className="font-bold text-stone-800">Cara mendapat payload QRIS statis</p>
              <p className="mt-1">
                Minta QRIS statis (tanpa nominal) dari penyedia QRIS Anda. Payload
                biasanya berupa teks panjang diawali <code>0002010102...</code>.
                Sistem akan menambahkan nominal dan kode unik secara otomatis saat
                membuat QRIS dinamis.
              </p>
              {settings.qris_merchant_name && (
                <p className="mt-2">
                  Merchant terdeteksi:{" "}
                  <strong>{settings.qris_merchant_name}</strong>
                  {settings.qris_merchant_city
                    ? ` — ${settings.qris_merchant_city}`
                    : ""}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
            <QrCode className="h-3.5 w-3.5" /> Pratinjau QRIS statis
          </p>
          <div className="mt-3 rounded-xl border border-stone-200 bg-white p-2">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QRIS statis" className="h-32 w-32" />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center text-center text-[11px] text-stone-400">
                Belum diatur
              </div>
            )}
          </div>
        </Card>
      </div>

      <SettingsForm
        settings={settings}
        sections={[
          {
            title: "QRIS statis & kode unik",
            description:
              "Kode unik ditambahkan ke nominal Ta'awun agar pembayaran mudah dicocokkan.",
            fields: [
              {
                key: "qris_payload",
                label: "Payload QRIS statis",
                textarea: true,
                placeholder: "000201010212...",
                hint: "Unggah gambar QRIS atau tempel payload secara manual.",
              },
              {
                key: "unique_code_base",
                label: "Kode unik dasar",
                type: "number",
                hint: "Contoh 9 → 9, 19, 29, ... 999 (maksimal 3 digit).",
              },
              {
                key: "invoice_expiry_hours",
                label: "Masa berlaku invoice (jam)",
                type: "number",
              },
            ],
          },
          {
            title: "WhatsApp & OTP",
            description: `Nomor admin saat ini: ${
              settings.admin_whatsapp ? formatPhone(settings.admin_whatsapp) : "belum diatur"
            }. Hubungkan worker di menu WhatsApp & OTP.`,
            fields: [
              {
                key: "admin_whatsapp",
                label: "Nomor WhatsApp admin",
                hint: "Dipakai sebagai fallback manual saat worker offline.",
              },
              {
                key: "otp_expiry_minutes",
                label: "Masa berlaku OTP (menit)",
                type: "number",
              },
              {
                key: "otp_template",
                label: "Template pesan OTP",
                textarea: true,
                hint: "Gunakan {{kode}} untuk kode dan {{menit}} untuk masa berlaku.",
              },
            ],
          },
          {
            title: "Google Sheets (opsional)",
            description:
              "Setiap invoice terverifikasi dapat dikirim otomatis ke Apps Script webhook.",
            fields: [
              {
                key: "sheets_webhook_url",
                label: "URL webhook Apps Script",
                type: "url",
                placeholder: "https://script.google.com/macros/s/.../exec",
              },
              {
                key: "sheets_webhook_secret",
                label: "Rahasia webhook",
                hint: "Opsional, dikirim sebagai field secret pada payload.",
              },
            ],
          },
        ]}
        renderControl={(field, value, setValue, controlId) =>
          field.key === "qris_payload" ? (
            <QrisPayloadField
              id={controlId}
              value={value}
              onChange={setValue}
            />
          ) : undefined
        }
      />
    </div>
  );
}
