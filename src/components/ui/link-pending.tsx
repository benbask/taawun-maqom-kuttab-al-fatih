"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "@/components/ui/spinner";

/**
 * Overlay loading untuk tombol berbasis <Link>.
 * Harus dirender di dalam <Link> (memanfaatkan useLinkStatus Next.js).
 * Menutup label dengan warna latar tombol supaya tidak terjadi pergeseran layout.
 */
export function LinkPending({ label }: { label?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <span className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-[inherit] bg-inherit">
      <Spinner />
      {label ? <span>{label}</span> : <span className="sr-only">Memuat halaman</span>}
    </span>
  );
}
