"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function UserLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Anda telah keluar.");
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-600 hover:bg-stone-50"
    >
      <LogOut className="h-3.5 w-3.5" /> Keluar
    </button>
  );
}
