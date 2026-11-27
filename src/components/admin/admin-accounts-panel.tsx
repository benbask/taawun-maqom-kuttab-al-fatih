"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import {
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
  SLOT_LABELS,
  SLOT_ORDER,
  type AdminPermission,
} from "@/lib/admin-permissions";
import type { Admin } from "@/lib/types";

interface Draft {
  username: string;
  isActive: boolean;
  permissions: AdminPermission[];
  password: string;
}

function initialDraft(admin: Admin | undefined): Draft {
  return {
    username: admin?.username ?? "",
    isActive: admin?.is_active ?? false,
    permissions: admin?.permissions ?? [],
    password: "",
  };
}

export function AdminAccountsPanel({ admins }: { admins: Admin[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      SLOT_ORDER.map((slot) => [
        slot,
        initialDraft(admins.find((admin) => admin.slot === slot)),
      ]),
    ),
  );
  const [saving, setSaving] = useState<string | null>(null);

  function update(slot: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [slot]: { ...current[slot], ...patch },
    }));
  }

  function togglePermission(slot: string, permission: AdminPermission) {
    const current = drafts[slot].permissions;
    update(slot, {
      permissions: current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    });
  }

  async function save(slot: string) {
    const draft = drafts[slot];
    if (!draft.username.trim()) {
      toast.error("Username wajib diisi.");
      return;
    }
    setSaving(slot);
    try {
      const response = await fetch(`/api/admin/accounts/${slot}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: draft.username.trim(),
          isActive: draft.isActive,
          permissions: draft.permissions,
          ...(draft.password ? { password: draft.password } : {}),
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Gagal menyimpan akun.");
        return;
      }
      update(slot, { password: "" });
      toast.success("Akun admin diperbarui. Admin terkait harus masuk ulang.");
      router.refresh();
    } catch {
      toast.error("Tidak dapat menghubungi server.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-bold">Hak akses bertingkat</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-800">
          Setiap kredensial bisa diaktifkan/dinonaktifkan dan diatur cakupan
          menunya. Perubahan hak akses berlaku setelah admin tersebut masuk
          ulang. Akun yang diaktifkan wajib diisi password barunya.
        </p>
      </div>

      {SLOT_ORDER.map((slot) => {
        const draft = drafts[slot];
        const admin = admins.find((item) => item.slot === slot);
        return (
          <Card key={slot} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-stone-900">
                    {SLOT_LABELS[slot] ?? slot}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {admin ? `Dibuat ${formatShortDate(admin.created_at)}` : "Belum tersedia"}
                  </p>
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) => update(slot, { isActive: event.target.checked })}
                  className="h-4 w-4 accent-emerald-800"
                />
                {draft.isActive ? "Aktif" : "Nonaktif"}
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Username</Label>
                <Input
                  value={draft.username}
                  onChange={(event) => update(slot, { username: event.target.value })}
                  placeholder="username_admin"
                />
              </div>
              <div>
                <Label>Password baru (opsional)</Label>
                <Input
                  type="password"
                  value={draft.password}
                  onChange={(event) => update(slot, { password: event.target.value })}
                  placeholder={admin ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-stone-700">Cakupan akses</p>
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {ADMIN_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex cursor-pointer items-center gap-2 text-xs text-stone-600"
                  >
                    <input
                      type="checkbox"
                      checked={draft.permissions.includes(permission)}
                      onChange={() => togglePermission(slot, permission)}
                      className="h-3.5 w-3.5 accent-emerald-800"
                    />
                    {PERMISSION_LABELS[permission]}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() => save(slot)}
                loading={saving === slot}
                loadingText="Menyimpan..."
              >
                {saving === slot ? null : <Save className="h-3.5 w-3.5" />}
                Simpan {SLOT_LABELS[slot] ?? slot}
              </Button>
            </div>
          </Card>
        );
      })}

      <p className="flex items-center gap-1.5 text-[11px] text-stone-400">
        <KeyRound className="h-3 w-3" /> Sandi disimpan terenkripsi (bcrypt).
      </p>
    </div>
  );
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("id-ID");
}
