"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UnpaidInvoice {
  id: string;
  invoiceNo: string;
}

export function UnpaidNotice({ invoices }: { invoices: UnpaidInvoice[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !invoices.length) return null;

  const first = invoices[0];

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))]",
        "rounded-2xl border border-rose-300 bg-rose-600 p-4 text-white shadow-2xl",
      )}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Tutup notifikasi"
        className="absolute right-2 top-2 rounded-lg p-1 text-white/70 transition hover:bg-white/10 hover:text-white active:translate-y-px"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-rose-100">
        <span className="h-2 w-2 rounded-full bg-white" /> Belum dibayar
      </p>
      <p className="mt-1.5 text-sm font-bold leading-snug">
        Invoice {first.invoiceNo} belum dibayar.
      </p>
      <Link
        href={`/invoice/${first.id}`}
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 active:translate-y-px"
      >
        <Upload className="h-3.5 w-3.5" /> Ketuk di sini untuk upload bukti transfer
      </Link>
      {invoices.length > 1 && (
        <Link
          href="/akun"
          className="mt-2 block text-[11px] font-semibold text-white/80 underline underline-offset-2"
        >
          +{invoices.length - 1} invoice lain — lihat di akun
        </Link>
      )}
    </div>
  );
}
