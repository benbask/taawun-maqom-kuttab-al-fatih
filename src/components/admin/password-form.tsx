"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal mengubah password.");
        return;
      }
      toast.success("Password admin berhasil diubah.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg p-5 sm:p-6">
      <div className="flex items-start gap-2">
        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
          <KeyRound className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-emerald-950">Ubah password</h2>
          <p className="text-xs text-stone-500">
            Gunakan password minimal 8 karakter dan jangan dibagikan.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="current-password">Password saat ini</Label>
          <Input
            id="current-password"
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <Label htmlFor="new-password">Password baru</Label>
          <Input
            id="new-password"
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <FieldHint>Minimal 8 karakter.</FieldHint>
        </div>
        <div>
          <Label htmlFor="confirm-password">Ulangi password baru</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        {error && <FieldError>{error}</FieldError>}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan password
        </Button>
      </form>
    </Card>
  );
}
