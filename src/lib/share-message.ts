import { formatRupiah } from "@/lib/format";
import type { OtsSummary } from "@/lib/types";

/** Teks siap pakai untuk tombol bagikan ke WhatsApp. */
export function buildWhatsAppShareMessage({
  total,
  percent,
  ots,
  url,
}: {
  total: number;
  percent: number;
  ots: OtsSummary;
  url: string;
}) {
  return (
    `📢 *INFO TERKINI MAQOM 2026*\n` +
    `_Kuttab Al Fatih Lampung PA_\n\n` +
    `Alhamdulillah, Ta'awun terkumpul:\n` +
    `💰 *${formatRupiah(total)}* *(${percent}% dari target)*\n\n` +
    `📋 *Data Partisipasi OTS (${ots.total} Keluarga):*\n` +
    `- ✅ Ikut Maqom: *${ots.hadir} keluarga*\n` +
    `- ❌ Tidak ikut: *${ots.tidak} keluarga*\n` +
    `- ⏳ Belum daftar: *${ots.belumDaftar} keluarga*\n` +
    `- 🤝 Sudah berta'awun: *${ots.bertaawun} dari ${ots.total} keluarga*\n\n` +
    `👉 *Klik di sini:*\n${url}\n` +
    `🔑 Masukkan kode keamanan: *Bismillah*\n\n` +
    `Mari daftar dan ikut bertaawun. Yang sudah bertaawun bisa menambah taawunnya loh. 😊`
  );
}
