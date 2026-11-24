"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      toast.success("Anda telah keluar.");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Gagal keluar.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition duration-150 ease-out",
        "active:translate-y-px active:scale-[0.98] motion-reduce:active:translate-y-0 motion-reduce:active:scale-100",
        "disabled:pointer-events-none disabled:opacity-60",
        compact
          ? "border border-white/15 text-emerald-100/80 hover:bg-white/10"
          : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
      )}
    >
      {loading ? <Spinner className="size-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
      {loading ? "Keluar…" : "Keluar"}
    </button>
  );
}
