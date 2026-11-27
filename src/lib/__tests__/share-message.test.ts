import { describe, expect, it } from "vitest";
import { formatRupiah } from "@/lib/format";
import { buildWhatsAppShareMessage } from "@/lib/share-message";
import type { OtsSummary } from "@/lib/types";

const ots: OtsSummary = {
  total: 126,
  terdaftar: 22,
  hadir: 19,
  tidak: 3,
  belumDaftar: 104,
  bertaawun: 21,
};

describe("pesan bagikan WhatsApp", () => {
  it("memakai format yang ditentukan panitia", () => {
    const message = buildWhatsAppShareMessage({
      total: 4_035_508,
      percent: 30,
      ots,
      url: "https://maqom2026.vercel.app/?ref=share-taawun",
    });

    expect(message).toBe(
      `📢 *INFO TERKINI MAQOM 2026*\n` +
        `_Kuttab Al Fatih Lampung PA_\n\n` +
        `Alhamdulillah, Ta'awun terkumpul:\n` +
        `💰 *${formatRupiah(4_035_508)}* *(30% dari target)*\n\n` +
        `📋 *Data Partisipasi OTS (126 Keluarga):*\n` +
        `- ✅ Ikut Maqom: *19 keluarga*\n` +
        `- ❌ Tidak ikut: *3 keluarga*\n` +
        `- ⏳ Belum daftar: *104 keluarga*\n` +
        `- 🤝 Sudah berta'awun: *21 dari 126 keluarga*\n\n` +
        `👉 *Klik di sini:*\nhttps://maqom2026.vercel.app/?ref=share-taawun\n` +
        `🔑 Masukkan kode keamanan: *Bismillah*\n\n` +
        `Mari daftar dan ikut bertaawun. Yang sudah bertaawun bisa menambah taawunnya loh. 😊`,
    );
  });

  it("memakai template kustom dari panel admin", () => {
    const message = buildWhatsAppShareMessage({
      total: 4_035_508,
      percent: 30,
      ots,
      url: "https://maqom2026.vercel.app/?ref=share-taawun",
      template:
        "Rekap: {total} ({percent}%). Ikut {hadir}, belum {belumDaftar}. {url} Kode {code}",
    });

    expect(message).toBe(
      `Rekap: ${formatRupiah(4_035_508)} (30%). Ikut 19, belum 104. ` +
        `https://maqom2026.vercel.app/?ref=share-taawun Kode Bismillah`,
    );
  });

  it("memakai template bawaan bila kosong", () => {
    const message = buildWhatsAppShareMessage({
      total: 4_035_508,
      percent: 30,
      ots,
      url: "https://maqom2026.vercel.app/?ref=share-taawun",
      template: "   ",
    });

    expect(message).toContain("📢 *INFO TERKINI MAQOM 2026*");
    expect(message).toContain(formatRupiah(4_035_508));
  });
});
