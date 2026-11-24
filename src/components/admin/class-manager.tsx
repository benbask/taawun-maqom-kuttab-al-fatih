"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GraduationCap, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { ClassRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ClassManager({ initial }: { initial: ClassRecord[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ClassRecord | "new" | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(record: ClassRecord | "new") {
    setEditing(record);
    setName(record === "new" ? "" : record.name);
    setLevel(record === "new" ? "" : record.level ?? "");
    setSortOrder(String(record === "new" ? initial.length : record.sort_order));
    setIsActive(record === "new" ? true : record.is_active);
    setError(null);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing !== "new" ? editing?.id : undefined,
          name: name.trim(),
          level: level.trim() || null,
          sort_order: Number(sortOrder),
          is_active: isActive,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal menyimpan kelas.");
        return;
      }
      toast.success("Kelas berhasil disimpan.");
      setEditing(null);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(record: ClassRecord) {
    if (!window.confirm(`Nonaktifkan kelas "${record.name}"?`)) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/classes?id=${record.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Gagal menonaktifkan kelas.");
        return;
      }
      toast.success("Kelas dinonaktifkan.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => open("new")}>
          <Plus className="h-4 w-4" /> Tambah kelas
        </Button>
      </div>

      {editing && (
        <Card className="border-emerald-200 bg-emerald-50/40 p-5">
          <h2 className="text-sm font-extrabold text-emerald-950">
            {editing === "new" ? "Kelas baru" : `Ubah ${editing.name}`}
          </h2>
          <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nama kelas</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Kelas 1A"
                required
              />
            </div>
            <div>
              <Label>Tingkat (opsional)</Label>
              <Input
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                placeholder="Contoh: Tingkat 1"
              />
            </div>
            <div>
              <Label>Urutan</Label>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-700"
                />
                Aktif tampil di formulir
              </label>
            </div>
            {error && (
              <div className="sm:col-span-2">
                <FieldError>{error}</FieldError>
              </div>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" loading={loading} loadingText="Menyimpan…">
                Simpan
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
          <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700">
            <GraduationCap className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-stone-900">Daftar kelas</p>
            <p className="text-xs text-stone-500">{initial.length} kelas tercatat</p>
          </div>
        </div>
        <div className="divide-y divide-stone-100">
          {initial.map((record) => (
            <div
              key={record.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800">{record.name}</p>
                <p className="text-[11px] text-stone-500">
                  {record.level ?? "Tanpa tingkat"} • urutan {record.sort_order}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={record.is_active ? "green" : "stone"}>
                  {record.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
                <button
                  type="button"
                  onClick={() => open(record)}
                  className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-emerald-700"
                  aria-label={`Ubah ${record.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(record)}
                  disabled={loading}
                  className={cn(
                    "rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600",
                    !record.is_active && "text-emerald-600",
                  )}
                  aria-label={record.is_active ? "Nonaktifkan" : "Nonaktif"}
                  title={record.is_active ? "Nonaktifkan" : "Sudah nonaktif"}
                >
                  {loading ? (
                    <Spinner className="size-3.5" />
                  ) : record.is_active ? (
                    <Power className="h-3.5 w-3.5" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
          {initial.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-stone-500">
              Belum ada kelas. Tambahkan kelas pertama Anda.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
