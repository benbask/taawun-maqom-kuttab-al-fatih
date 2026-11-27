"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { buttonClasses } from "@/components/ui/button";
import { buildWhatsAppShareMessage } from "@/lib/share-message";
import type { OtsSummary } from "@/lib/types";

export function ShareProgressButton({
  total,
  percent,
  ots,
  template,
}: {
  total: number;
  percent: number;
  ots: OtsSummary;
  template?: string | null;
}) {
  function share() {
    const url = `${window.location.origin}/?ref=share-taawun`;
    const text = buildWhatsAppShareMessage({
      total,
      percent,
      ots,
      url,
      template,
    });

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
