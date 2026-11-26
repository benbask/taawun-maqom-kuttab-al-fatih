"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Indikator navigasi global. Berjalan untuk tautan internal di halaman publik
 * maupun admin, termasuk navigasi programatik yang mengirim event
 * `taawun:navigate` (mis. dropdown kelas di halaman verifikasi).
 */
export function NavigationLoading() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: number | null = null;
    let poll: number | null = null;
    let startedAt = 0;

    function stop() {
      setVisible(false);
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      if (poll !== null) {
        window.clearInterval(poll);
        poll = null;
      }
    }

    function show(currentUrl: string) {
      startedAt = Date.now();
      setVisible(true);
      if (timer !== null) window.clearTimeout(timer);
      if (poll !== null) window.clearInterval(poll);

      // Pengaman bila navigasi gagal/terblokir.
      timer = window.setTimeout(stop, 8000);

      // Cek perubahan path atau query supaya navigasi ke halaman yang sama
      // dengan query berbeda (mis. ?kelas=...) tetap terdeteksi.
      poll = window.setInterval(() => {
        if (
          window.location.pathname + window.location.search !== currentUrl &&
          Date.now() - startedAt >= 400
        ) {
          stop();
        }
      }, 80);
    }

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest("a") : null;
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const raw = anchor.getAttribute("href");
      if (
        !raw ||
        raw.startsWith("#") ||
        raw.startsWith("mailto:") ||
        raw.startsWith("tel:") ||
        raw.startsWith("data:") ||
        raw.startsWith("javascript:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const current = window.location.pathname + window.location.search;
      const next = url.pathname + url.search;
      // Tautan ke halaman yang sama (termasuk anchor #) bukan navigasi penuh.
      if (next === current) return;

      show(current);
    }

    function onProgrammatic() {
      show(window.location.pathname + window.location.search);
    }

    window.addEventListener("click", onClick, true);
    window.addEventListener("taawun:navigate", onProgrammatic);
    window.addEventListener("popstate", stop);

    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("taawun:navigate", onProgrammatic);
      window.removeEventListener("popstate", stop);
      stop();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/25 backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-950 px-5 py-4 text-white shadow-2xl ring-1 ring-white/10">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-300" />
        <div>
          <p className="text-sm font-extrabold leading-tight">Mohon tunggu...</p>
          <p className="mt-0.5 text-[11px] text-emerald-100/70">
            Halaman sedang dimuat
          </p>
        </div>
      </div>
    </div>
  );
}
