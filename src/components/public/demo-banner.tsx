"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export function DemoBanner() {
  const router = useRouter();
  const [busy, setBusy] = useState<"logout" | "delete" | null>(null);

  async function logout() {
    if (busy) return;
    setBusy("logout");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Anda keluar dari mode demo.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Gagal keluar dari mode demo.");
      setBusy(null);
    }
  }

  async function remove() {
    if (busy) return;
    if (
      !window.confirm(
        "Hapus semua data demo? Data contoh yang Anda buat akan dihapus dan tidak bisa dikembalikan.",
      )
    ) {
      return;
    }
    setBusy("delete");
    try {
      const response = await fetch("/api/demo/delete", { method: "POST" });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Gagal menghapus data demo.");
        setBusy(null);
        return;
      }
      toast.success("Data demo dihapus. Anda telah keluar.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Tidak dapat menghubungi server.");
      setBusy(null);
    }
  }

  const buttonClass =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-950/25 bg-amber-950/10 px-2.5 text-[11px] font-bold text-amber-950 transition hover:bg-amber-950/20 active:translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 motion-reduce:active:translate-y-0 motion-reduce:active:scale-100";

  return (
    <div className="bg-amber-400 px-4 py-2 text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-xs font-semibold">
        <span>
          Mode demo — data yang Anda buat hanya untuk mencoba dan tidak tampil di
          rekap publik.
        </span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={logout}
            disabled={Boolean(busy)}
            aria-busy={busy === "logout" || undefined}
            className={buttonClass}
          >
            {busy === "logout" ? (
              <Spinner className="size-3.5" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            Keluar demo
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={Boolean(busy)}
            aria-busy={busy === "delete" || undefined}
            className={buttonClass}
          >
            {busy === "delete" ? (
              <Spinner className="size-3.5" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Hapus data demo
          </button>
        </span>
      </div>
    </div>
  );
}
