"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";

export function AdminLoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState(demo ? "admin" : "");
  const [password, setPassword] = useState(demo ? "Taawun123!" : "");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal masuk.");
        return;
      }
      toast.success("Selamat datang kembali.");
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="admin"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <FieldError>{error}</FieldError>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        Masuk panel admin
      </Button>

      {demo && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Mode demo: gunakan <strong>admin</strong> / <strong>Taawun123!</strong>
        </p>
      )}
    </form>
  );
}
