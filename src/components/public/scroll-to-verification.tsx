"use client";

import { useEffect } from "react";

/**
 * Menggulir ke kartu rincian pembayaran setelah kelas dipilih.
 * Dipicu oleh perubahan kelas terpilih dari server.
 */
export function ScrollToVerification({
  selectedClassId,
}: {
  selectedClassId: string | null;
}) {
  useEffect(() => {
    if (!selectedClassId) return;
    let frame = 0;
    let timer = 0;
    let attempts = 0;

    const scroll = () => {
      const target = document.getElementById("rincian-pembayaran");
      if (!target) {
        if (attempts < 20) {
          attempts += 1;
          timer = window.setTimeout(scroll, 80);
        }
        return;
      }
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    frame = window.requestAnimationFrame(scroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [selectedClassId]);

  return null;
}
