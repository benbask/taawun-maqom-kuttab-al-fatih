"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AdminNav } from "@/components/admin/nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";
import { SLOT_LABELS } from "@/lib/admin-permissions";

function AccountCard({
  username,
  slot,
}: {
  username: string;
  slot: string | null;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/40">
        Masuk sebagai
      </p>
      <p className="mt-1 truncate text-sm font-bold text-white">{username}</p>
      <p className="mt-0.5 truncate text-[10px] font-semibold text-emerald-200/60">
        {SLOT_LABELS[slot ?? ""] ?? "Admin"}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200/80 hover:text-amber-100"
        >
          Situs publik <ArrowUpRight className="h-3 w-3" />
        </Link>
        <LogoutButton compact />
      </div>
    </div>
  );
}

export function AdminSidebar({
  siteName,
  username,
  slot,
  permissions,
}: {
  siteName: string;
  username: string;
  slot: string | null;
  permissions: string[] | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-emerald-950 px-4 py-5 lg:flex">
        <Link href="/admin" className="mb-6 block px-1">
          <Logo siteName={siteName} light />
        </Link>
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <AdminNav permissions={permissions} />
        </div>
        <AccountCard username={username} slot={slot} />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu admin"
        title="Buka menu admin"
        className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/10 bg-white text-emerald-900 shadow-sm lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-emerald-950 px-4 py-5 shadow-2xl transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="mb-6 flex items-center justify-between gap-2 px-1">
          <Link href="/admin" onClick={() => setOpen(false)} className="min-w-0 flex-1 overflow-hidden">
            <Logo siteName={siteName} light />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu admin"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-emerald-100 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <AdminNav
            permissions={permissions}
            onNavigate={() => setOpen(false)}
          />
        </div>
        <AccountCard username={username} slot={slot} />
      </aside>
    </>
  );
}
