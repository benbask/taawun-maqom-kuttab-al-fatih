"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListChecks, Loader2, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FieldError,
  FieldHint,
  Input,
  Label,
  Select,
} from "@/components/ui/field";
import type { FieldScope, FieldType, FormField } from "@/lib/types";

const types: Array<{ value: FieldType; label: string }> = [
  { value: "text", label: "Teks" },
  { value: "textarea", label: "Paragraf" },
  { value: "number", label: "Angka" },
  { value: "select", label: "Pilihan" },
  { value: "date", label: "Tanggal" },
  { value: "checkbox", label: "Centangan" },
];

function emptyField(scope: FieldScope): FormField {
  return {
    id: "",
    scope,
    key: "",
    label: "",
    type: "text",
    placeholder: null,
    help_text: null,
    required: false,
    options: [],
    sort_order: 0,
    is_active: true,
    created_at: "",
  };
}

export function FieldManager({ initial }: { initial: FormField[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<FormField | "new-family" | "new-student" | null>(null);
  const [form, setForm] = useState<FormField>(emptyField("family"));
  const [optionsText, setOptionsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(record: FormField | "new-family" | "new-student") {
    const next =
      record === "new-family"
        ? emptyField("family")
        : record === "new-student"
          ? emptyField("student")
          : { ...record };
    setEditing(record);
    setForm(next);
    setOptionsText(next.options.join("\n"));
    setError(null);
  }

  function patch(values: Partial<FormField>) {
    setForm((current) => ({ ...current, ...values }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          scope: form.scope,
          label: form.label.trim(),
          key: form.key.trim() || undefined,
          type: form.type,
          placeholder: form.placeholder || null,
          help_text: form.help_text || null,
          required: form.required,
          options:
            form.type === "select"
              ? optionsText.split("\n").map((value) => value.trim()).filter(Boolean)
              : [],
          sort_order: Number(form.sort_order),
          is_active: form.is_active,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal menyimpan field.");
        return;
      }
      toast.success("Field formulir berhasil disimpan.");
      setEditing(null);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(record: FormField) {
    if (!window.confirm(`Nonaktifkan field "${record.label}"?`)) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/fields?id=${record.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Gagal menonaktifkan field.");
        return;
      }
      toast.success("Field dinonaktifkan.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => open("new-family")}>
          <Plus className="h-4 w-4" /> Field wali
        </Button>
        <Button onClick={() => open("new-student")}>
          <Plus className="h-4 w-4" /> Field santri
        </Button>
      </div>

      {editing && (
        <Card className="border-emerald-200 bg-emerald-50/40 p-5">
          <h2 className="text-sm font-extrabold text-emerald-950">
            {editing === "new-family" || editing === "new-student"
              ? "Field baru"
              : `Ubah ${editing.label}`}
          </h2>
          <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Label</Label>
              <Input
                value={form.label}
                onChange={(event) => patch({ label: event.target.value })}
                placeholder="Contoh: Nama ibu"
                required
              />
            </div>
            <div>
              <Label>Key (opsional)</Label>
              <Input
                value={form.key}
                onChange={(event) => patch({ key: event.target.value })}
                placeholder="nama_ibu"
              />
              <FieldHint>Huruf kecil, angka, underscore. Dibuat otomatis jika kosong.</FieldHint>
            </div>
            <div>
              <Label>Tipe</Label>
              <Select
                value={form.type}
                onChange={(event) => patch({ type: event.target.value as FieldType })}
              >
                {types.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Scope</Label>
              <Select
                value={form.scope}
                onChange={(event) => patch({ scope: event.target.value as FieldScope })}
              >
                <option value="family">Data wali</option>
                <option value="student">Data santri</option>
              </Select>
            </div>
            <div>
              <Label>Placeholder</Label>
              <Input
                value={form.placeholder ?? ""}
                onChange={(event) => patch({ placeholder: event.target.value })}
              />
            </div>
            <div>
              <Label>Urutan</Label>
              <Input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(event) => patch({ sort_order: Number(event.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Bantuan</Label>
              <Input
                value={form.help_text ?? ""}
                onChange={(event) => patch({ help_text: event.target.value })}
                placeholder="Petunjuk singkat di bawah field"
              />
            </div>
            {form.type === "select" && (
              <div className="sm:col-span-2">
                <Label>Opsi (satu per baris)</Label>
                <textarea
                  value={optionsText}
                  onChange={(event) => setOptionsText(event.target.value)}
                  className="min-h-24 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                  placeholder={"Laki-laki\nPerempuan"}
                />
              </div>
            )}
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.required}
                  onChange={(event) => patch({ required: event.target.checked })}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-700"
                />
                Wajib diisi
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => patch({ is_active: event.target.checked })}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-700"
                />
                Aktif
              </label>
            </div>
            {error && (
              <div className="sm:col-span-2">
                <FieldError>{error}</FieldError>
              </div>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {(["family", "student"] as const).map((scope) => {
        const rows = initial.filter((field) => field.scope === scope);
        return (
          <Card key={scope} className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700">
                  <ListChecks className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-stone-900">
                    {scope === "family" ? "Field data wali" : "Field data santri"}
                  </p>
                  <p className="text-xs text-stone-500">{rows.length} field</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-stone-100">
              {rows
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((field) => (
                  <div
                    key={field.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-stone-800">
                        {field.label}
                        {field.required && <span className="ml-1 text-rose-500">*</span>}
                      </p>
                      <p className="font-mono text-[11px] text-stone-400">
                        {field.key} • {field.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={field.is_active ? "green" : "stone"}>
                        {field.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => open(field)}
                        className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-emerald-700"
                        aria-label={`Ubah ${field.label}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(field)}
                        disabled={loading}
                        className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Nonaktifkan ${field.label}`}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              {rows.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-stone-500">
                  Belum ada field.
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
