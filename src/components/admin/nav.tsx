"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  FileSpreadsheet,
  GraduationCap,
  History,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  QrCode,
  ScrollText,
  Settings,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/verifikasi", label: "Verifikasi", icon: BadgeCheck },
  { href: "/admin/konten", label: "Konten Beranda", icon: ScrollText },
  { href: "/admin/kelas", label: "Kelas", icon: GraduationCap },
  { href: "/admin/form", label: "Formulir", icon: ListChecks },
  { href: "/admin/qris", label: "QRIS & Pengaturan", icon: QrCode },
  { href: "/admin/whatsapp", label: "WhatsApp & OTP", icon: MessageCircle },
  { href: "/admin/export", label: "Ekspor Data", icon: FileSpreadsheet },
  { href: "/admin/audit", label: "Audit Log", icon: History },
  { href: "/admin/akun", label: "Akun Admin", icon: UserRound },
];

export function AdminNav({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav className="scrollbar-thin flex gap-1.5 overflow-x-auto pb-1">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold",
                active
                  ? "bg-emerald-900 text-white"
                  : "border border-stone-200 bg-white text-stone-600",
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/40">
        Menu admin
      </p>
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-white/10 text-white ring-1 ring-white/10"
                : "text-emerald-100/60 hover:bg-white/5 hover:text-white",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
      <div className="mt-4 border-t border-white/10 pt-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-100/60 hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-4 w-4" /> Lihat situs publik
        </Link>
      </div>
    </nav>
  );
}
