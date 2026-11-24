"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      toast.success("Anda telah keluar.");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Gagal keluar.");
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={
        compact
          ? "inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-xs font-semibold text-emerald-100/80 hover:bg-white/10"
          : "inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-600 hover:bg-stone-50"
      }
    >
      <LogOut className="h-3.5 w-3.5" /> Keluar
    </button>
  );
}
