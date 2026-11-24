"use client";

import { useState } from "react";
import { GraduationCap, HeartHandshake, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AccountRole } from "@/lib/account-roles";
import { cn } from "@/lib/utils";

/**
 * Dipakai sekali setelah OTP berhasil dan bisa dipanggil ulang dari /akun
 * untuk mengubah peran.
 */
export function RoleSelector({
  onDone,
  currentRole,
  title = "Pilih peran Anda",
  description = "Supaya kami bisa menyiapkan formulir yang sesuai.",
}: {
  onDone: (role: AccountRole) => void | Promise<void>;
  currentRole?: AccountRole | null;
  title?: string;
  description?: string;
}) {
  const [saving, setSaving] = useState<AccountRole | null>(null);

  async function choose(role: AccountRole, profile?: Record<string, unknown>) {
    if (saving) return;
    setSaving(role);
    try {
      const response = await fetch("/api/account/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ...(profile ? { profile } : {}) }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Gagal menyimpan peran.");
        return;
      }
      toast.success("Peran berhasil disimpan.");
      await onDone(role);
    } catch {
      toast.error("Tidak dapat menghubungi server.");
    } finally {
      setSaving(null);
    }
  }

  const cardClass =
    "rounded-2xl border border-stone-200 bg-white p-5 text-left transition hover:border-emerald-300 hover:shadow-sm";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-emerald-950">{title}</h2>
        <p className="mt-0.5 text-sm text-stone-500">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={cn(cardClass, currentRole === "ots" && "ring-2 ring-emerald-600/20")}>
          <span className="inline-flex rounded-xl bg-emerald-50 p-2 text-emerald-700">
            <UsersRound className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-stone-900">OTS Aktif</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Masih memiliki anak yang aktif belajar. Daftarkan anak dan kelasnya.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-4 w-full"
            disabled={Boolean(saving)}
            loading={saving === "ots"}
            onClick={() => choose("ots")}
          >
            Daftarkan santri
          </Button>
        </div>

        <div
          className={cn(
            cardClass,
            currentRole === "alumni_join" && "ring-2 ring-emerald-600/20",
          )}
        >
          <span className="inline-flex rounded-xl bg-amber-50 p-2 text-amber-700">
            <GraduationCap className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-stone-900">OTS Alumni</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Cukup isi tahun angkatan, tanpa menambahkan data anak.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-4 w-full"
            disabled={Boolean(saving)}
            loading={saving === "alumni_join"}
            onClick={() => choose("alumni_join")}
          >
            Isi tahun angkatan
          </Button>
        </div>

        <div
          className={cn(
            cardClass,
            currentRole === "outsider" && "ring-2 ring-emerald-600/20",
          )}
        >
          <span className="inline-flex rounded-xl bg-sky-50 p-2 text-sky-700">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-stone-900">Donatur umum</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Ingin ikut ber-ta&apos;awun tanpa data santri.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4 w-full"
            disabled={Boolean(saving)}
            loading={saving === "outsider"}
            onClick={() => choose("outsider")}
          >
            Ta&apos;awun umum
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-stone-400">
        Peran bisa diubah lagi dari halaman akun.
      </p>
    </div>
  );
}
