"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { buttonClasses } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import type { OtsSummary } from "@/lib/types";

export function ShareProgressButton({
  total,
  percent,
  ots,
}: {
  total: number;
  percent: number;
  ots: OtsSummary;
}) {
  function share() {
    const url = `${window.location.origin}/?ref=share-taawun`;
    const text =
      `Alhamdulillah, Ta'awun Maqom Kuttab Al Fatih Lampung sudah terkumpul ` +
      `${formatRupiah(total)} (${percent}% dari target).\n\n` +
      `Partisipasi OTS: ${ots.hadir} ikut Maqom, ${ots.tidak} tidak ikut, ` +
      `${ots.belumDaftar} belum mendaftar, ${ots.bertaawun} bertaawun ` +
      `dari ${ots.total} keluarga OTS.\n\n` +
      `Yuk ikut berTa'awun: ${url}`;

    const popup = window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );

    if (!popup) {
      toast.error("Browser memblokir jendela baru. Izinkan pop-up lalu coba lagi.");
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={share}
        className={buttonClasses("gold", "md", "w-full")}
      >
        <Share2 className="h-4 w-4 shrink-0" /> Bagikan ke WhatsApp
      </button>
      <p className="mt-2 text-center text-[11px] text-stone-400">
        Kartu pratinjau otomatis memakai data perolehan terbaru.
      </p>
    </div>
  );
}
