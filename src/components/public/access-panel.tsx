"use client";

import { useState } from "react";
import { KeyRound, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";
import type { AccountRole } from "@/lib/account-roles";

export interface SimpleAuthResult {
  phone: string;
  familyId: string | null;
  role: AccountRole | null;
  parentName: string;
  demo: boolean;
}

export function AccessPanel({
  initialPhone = "",
  title = "Masuk dengan WhatsApp",
  description = "Masukkan nomor WhatsApp dan Kode Keamanan yang diberikan di grup angkatan.",
  submitLabel = "Lanjutkan",
  onAuthenticated,
}: {
  initialPhone?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  onAuthenticated: (result: SimpleAuthResult) => void | Promise<void>;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!phone.trim()) {
      setError("Nomor WhatsApp wajib diisi.");
      return;
    }
    if (!password.trim()) {
      setError("Kode Keamanan wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password: password.trim() }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      } & Partial<SimpleAuthResult>;

      if (!response.ok || !data.ok || !data.phone) {
        setError(data.error ?? "Gagal memproses nomor. Silakan coba lagi.");
        return;
      }

      toast.success("Nomor WhatsApp tercatat.");
      await onAuthenticated({
        phone: data.phone,
        familyId: data.familyId ?? null,
        role: data.role ?? null,
        parentName: data.parentName ?? "",
        demo: Boolean(data.demo),
      });
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-100">
          <Smartphone className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-emerald-950">
            {title}
          </h2>
          <p className="mt-0.5 text-sm leading-relaxed text-stone-500">
            {description}
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="access-phone">Nomor WhatsApp</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">
            +62
          </span>
          <Input
            id="access-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0812 3456 7890"
            inputMode="tel"
            autoComplete="tel"
            className="pl-12"
            required
          />
        </div>
        <FieldHint>
          Periksa kembali nomor Anda sebelum melanjutkan. Nomor yang salah
          membuat data dan invoice tidak dapat ditemukan. Boleh 08xx, 8xx atau
          62xx, sistem menyesuaikan otomatis.
        </FieldHint>
      </div>

      <div>
        <Label htmlFor="access-password">Masukkan Kode Keamanan</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
            <KeyRound className="h-4 w-4" />
          </span>
          <Input
            id="access-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan Kode Keamanan"
            autoComplete="current-password"
            className="pl-11 pr-16"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-700 hover:underline"
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
        <FieldHint>
          Kode Keamanan untuk memproteksi data, diberikan di pengumuman Maqom
          di masing-masing grup angkatan.
        </FieldHint>
      </div>

      {error && <FieldError>{error}</FieldError>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        {submitLabel}
      </Button>
    </form>
  );
}
