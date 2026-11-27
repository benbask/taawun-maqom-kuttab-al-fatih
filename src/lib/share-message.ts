import { formatRupiah } from "@/lib/format";
import type { OtsSummary } from "@/lib/types";

export const DEFAULT_WHATSAPP_TEMPLATE = `📢 *INFO TERKINI MAQOM 2026*
_Kuttab Al Fatih Lampung PA_

Alhamdulillah, Ta'awun terkumpul:
💰 *{total}* *({percent}% dari target)*

📋 *Data Partisipasi OTS ({otsTotal} Keluarga):*
- ✅ Ikut Maqom: *{hadir} keluarga*
- ❌ Tidak ikut: *{tidak} keluarga*
- ⏳ Belum daftar: *{belumDaftar} keluarga*
- 🤝 Sudah berta'awun: *{bertaawun} dari {otsTotal} keluarga*

👉 *Klik di sini:*
{url}
🔑 Masukkan kode keamanan: *{code}*

Mari daftar dan ikut bertaawun. Yang sudah bertaawun bisa menambah taawunnya loh. 😊`;

export const WHATSAPP_PLACEHOLDERS = [
  "{total}",
  "{percent}",
  "{otsTotal}",
  "{hadir}",
  "{tidak}",
  "{belumDaftar}",
  "{bertaawun}",
  "{url}",
  "{code}",
] as const;

/** Teks siap pakai untuk tombol bagikan ke WhatsApp. */
export function buildWhatsAppShareMessage({
  total,
  percent,
  ots,
  url,
  template,
}: {
  total: number;
  percent: number;
  ots: OtsSummary;
  url: string;
  template?: string | null;
}) {
  const source = template?.trim() ? template : DEFAULT_WHATSAPP_TEMPLATE;
  const values: Record<string, string> = {
    total: formatRupiah(total),
    percent: String(percent),
    otsTotal: String(ots.total),
    hadir: String(ots.hadir),
    tidak: String(ots.tidak),
    belumDaftar: String(ots.belumDaftar),
    bertaawun: String(ots.bertaawun),
    url,
    code: "Bismillah",
  };

  return source.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
