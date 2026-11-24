"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export function UserLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Anda telah keluar.");
      router.push("/");
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
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-600 transition duration-150 ease-out hover:bg-stone-50 active:translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 motion-reduce:active:translate-y-0 motion-reduce:active:scale-100"
    >
      {loading ? <Spinner className="size-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
      {loading ? "Keluar…" : "Keluar"}
    </button>
  );
}
