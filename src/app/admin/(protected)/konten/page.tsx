import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { WhatsappTemplateReset } from "@/components/admin/whatsapp-template-reset";
import { Card } from "@/components/ui/card";
import { DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/share-message";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Konten Beranda",
  robots: { index: false, follow: false },
};

export default async function AdminContentPage() {
  const current = await getStore().getSettings();
  const settings = {
    ...current,
    share_wa_template: current.share_wa_template || DEFAULT_WHATSAPP_TEMPLATE,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pengaturan"
        title="Konten beranda"
        description="Ubah teks yang tampil di halaman publik. Markdown didukung pada information box."
      />

      <SettingsForm
        settings={settings}
        sections={[
          {
            title: "Identitas situs",
            fields: [
              { key: "site_name", label: "Nama situs" },
              { key: "tagline", label: "Tagline" },
              {
                key: "logo_url",
                label: "Logo",
                type: "image",
                hint: "Unggah logo atau tempel URL. Biarkan kosong untuk logo bawaan.",
              },
              {
                key: "hero_image_url",
                label: "Gambar hero",
                type: "image",
                hint: "Unggah gambar atau tempel URL HTTPS.",
              },
            ],
          },
          {
            title: "Hero & informasi Ta'awun",
            fields: [
              { key: "hero_title", label: "Judul hero" },
              {
                key: "hero_subtitle",
                label: "Subtitle hero",
                textarea: true,
              },
              {
                key: "info_markdown",
                label: "Informasi Ta'awun (Markdown)",
                textarea: true,
                hint: "Gunakan **tebal**, - untuk poin, dan [tautan](https://...).",
              },
              {
                key: "target_amount",
                label: "Target dana (Rp)",
                type: "number",
                hint: "Angka tanpa titik, contoh: 500000000.",
              },
              {
                key: "deadline",
                label: "Batas waktu",
                type: "date",
              },
            ],
          },
          {
            title: "Pratinjau saat dibagikan (WhatsApp & media sosial)",
            description:
              "Dipakai saat tautan situs dibagikan di WhatsApp, Facebook, X, atau Telegram.",
            fields: [
              {
                key: "share_title",
                label: "Judul pratinjau tautan",
                hint: "Kosongkan untuk memakai nama situs. Disarankan maksimal 60 karakter.",
              },
              {
                key: "share_description",
                label: "Deskripsi pratinjau tautan",
                textarea: true,
                hint: "Kosongkan untuk memakai tagline. Disarankan 80–160 karakter.",
              },
              {
                key: "share_image_url",
                label: "Gambar pratinjau",
                type: "image",
                hint: "Unggah gambar atau tempel URL HTTPS. Disarankan 1200 × 630 px. Kosongkan bila tidak ingin menampilkan gambar.",
              },
            ],
          },
          {
            title: "Pesan WhatsApp",
            description:
              "Template tombol “Bagikan ke WhatsApp” di halaman utama. Nominal, persentase, dan data OTS diisi otomatis.",
            fields: [
              {
                key: "share_wa_template",
                label: "Template pesan",
                textarea: true,
                placeholder: DEFAULT_WHATSAPP_TEMPLATE,
                hint:
                  "Placeholder yang tersedia: {total}, {percent}, {otsTotal}, {hadir}, {tidak}, {belumDaftar}, {bertaawun}, {url}, {code}. Kosongkan untuk memakai template bawaan.",
              },
            ],
          },
          {
            title: "Kontak & kredit",
            fields: [
              { key: "contact_name", label: "Nama kontak" },
              {
                key: "contact_whatsapp",
                label: "Nomor WhatsApp kontak",
                hint: "Format 08xx atau 62xx.",
              },
              { key: "address", label: "Alamat" },
              {
                key: "footer_credit",
                label: "Kredit footer",
                hint: "Nama pengembang / kontributor yang ditampilkan di footer.",
              },
            ],
          },
        ]}
      />

      <Card className="mt-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-stone-900">Template bawaan</p>
          <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
            Kembalikan format pesan WhatsApp ke template panitia. Perubahan
            tersimpan setelah tombol ditekan.
          </p>
        </div>
        <WhatsappTemplateReset />
      </Card>
    </div>
  );
}
