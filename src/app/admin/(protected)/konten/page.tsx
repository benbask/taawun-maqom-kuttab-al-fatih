import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Konten Beranda",
  robots: { index: false, follow: false },
};

export default async function AdminContentPage() {
  const settings = await getStore().getSettings();

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
                label: "URL logo",
                type: "url",
                hint: "Biarkan kosong untuk menggunakan logo bawaan.",
              },
              {
                key: "hero_image_url",
                label: "URL gambar hero",
                type: "url",
                hint: "Gunakan tautan gambar publik (HTTPS).",
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
                label: "URL gambar pratinjau",
                type: "url",
                hint: "Tautan HTTPS gambar JPG/PNG, disarankan 1200 × 630 px. Kosongkan bila tidak ingin menampilkan gambar.",
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
    </div>
  );
}
