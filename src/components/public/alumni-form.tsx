"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, FieldHint, Input, Label, Textarea } from "@/components/ui/field";

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
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/account/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "alumni_join", profile: form }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal menyimpan data alumni.");
        return;
      }
      toast.success("Data alumni tersimpan. Silakan lanjut ta'awun.");
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
            Isi data berikut untuk melanjutkan sebagai alumni yang ikut Maqom.
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
          <Label htmlFor="alumni-angkatan">Angkatan / tahun lulus</Label>
          <Input
            id="alumni-angkatan"
            value={form.angkatan}
            onChange={(event) => set("angkatan", event.target.value)}
            placeholder="Contoh: 2019"
            required
          />
        </div>
        <div>
          <Label htmlFor="alumni-wa">Nomor WhatsApp</Label>
          <Input
            id="alumni-wa"
            value={form.whatsapp}
            onChange={(event) => set("whatsapp", event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="alumni-kota">Kota / domisili</Label>
          <Input
            id="alumni-kota"
            value={form.kota}
            onChange={(event) => set("kota", event.target.value)}
            placeholder="Contoh: Bandar Lampung"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="alumni-catatan">Catatan (opsional)</Label>
          <Textarea
            id="alumni-catatan"
            value={form.catatan}
            onChange={(event) => set("catatan", event.target.value)}
            placeholder="Ceritakan minat Anda untuk ikut Maqom..."
          />
          <FieldHint>Admin akan menghubungi Anda jika diperlukan.</FieldHint>
        </div>

        {error && (
          <div className="sm:col-span-2">
            <FieldError>{error}</FieldError>
          </div>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" loading={loading} loadingText="Menyimpan…" size="lg" className="w-full">
            Simpan &amp; lanjut ta&apos;awun
          </Button>
        </div>
      </form>
    </Card>
  );
}
