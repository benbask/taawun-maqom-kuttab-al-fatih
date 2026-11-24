"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";

export function AlumniForm({
  initial,
}: {
  initial: {
    nama: string;
    angkatan: string;
    whatsapp: string;
    kota: string;
    catatan: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.nama.trim().length < 2) {
      setError("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (form.angkatan.trim().length < 2) {
      setError("Tahun angkatan wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/account/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "alumni_join",
          parentName: form.nama.trim(),
          profile: {
            ...form,
            nama: form.nama.trim(),
            angkatan: form.angkatan.trim(),
          },
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal menyimpan data alumni.");
        return;
      }
      toast.success("Data alumni tersimpan. Silakan lanjut Ta'awun.");
      router.push("/tambah");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-amber-50 p-2 text-amber-700">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-emerald-950">Data alumni</h2>
          <p className="text-xs text-stone-500">
            Cukup isi tahun angkatan. Tidak perlu menambahkan data anak.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="alumni-nama">Nama lengkap</Label>
          <Input
            id="alumni-nama"
            value={form.nama}
            onChange={(event) => set("nama", event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="alumni-angkatan">
            Tahun angkatan / lulus <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="alumni-angkatan"
            value={form.angkatan}
            onChange={(event) => set("angkatan", event.target.value)}
            placeholder="Contoh: 2019"
            inputMode="numeric"
            required
          />
        </div>

        {error && (
          <div className="sm:col-span-2">
            <FieldError>{error}</FieldError>
          </div>
        )}

        <div className="sm:col-span-2">
          <Button
            type="submit"
            loading={loading}
            loadingText="Menyimpan…"
            size="lg"
            className="w-full"
          >
            <ArrowRight className="h-4 w-4" /> Simpan &amp; lanjut Ta&apos;awun
          </Button>
          <FieldHint className="mt-2 text-center">
            Admin dapat menghubungi Anda melalui nomor WhatsApp yang sudah
            terverifikasi.
          </FieldHint>
        </div>
      </form>
    </Card>
  );
}
