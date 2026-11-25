"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { GoogleSignInButton } from "@/components/public/google-signin-button";
import { AccessPanel } from "@/components/public/access-panel";
import { PhoneOtpPanel } from "@/components/public/phone-otp-panel";

export function LoginFlow({
  next,
  googleEnabled,
  googleClientId,
  bindMode = false,
  googleName,
}: {
  next: string;
  googleEnabled: boolean;
  googleClientId: string;
  bindMode?: boolean;
  googleName?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/akun";

  function finish() {
    router.push(safeNext);
    router.refresh();
  }

  async function handleGoogle(credential: string) {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        linked?: boolean;
      };
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Gagal masuk dengan Google.");
        return;
      }
      if (data.linked) {
        toast.success("Berhasil masuk dengan Google.");
        finish();
      } else {
        router.push(`/masuk?google=bind&next=${encodeURIComponent(safeNext)}`);
        router.refresh();
      }
    } catch {
      toast.error("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBind() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/google/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Gagal menghubungkan akun Google.");
        return;
      }
      toast.success("Akun Google berhasil dihubungkan.");
      finish();
    } catch {
      toast.error("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  if (bindMode) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-950">
            <Mail className="h-4 w-4" /> Hubungkan akun Google
          </p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-900/75">
            {googleName ? `${googleName}, ` : ""}verifikasi nomor WhatsApp Anda
            sekali ini untuk menghubungkan akun Google dengan data Ta&apos;awun.
            Login berikutnya tidak perlu OTP lagi.
          </p>
        </div>

        <PhoneOtpPanel
          title="Verifikasi nomor WhatsApp"
          description="Kode OTP 4 digit dikirim ke nomor yang Anda masukkan. Nomor ini dipakai untuk invoice dan rekap verifikasi."
          submitLabel="Kirim kode penghubung"
          onVerified={handleBind}
        />

        {loading && (
          <p className="text-center text-xs text-stone-500">
            Menghubungkan akun...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <>
          <div className="space-y-3">
            <GoogleSignInButton
              clientId={googleClientId}
              onCredential={handleGoogle}
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-stone-200" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
              atau
            </span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>
        </>
      )}

      <AccessPanel
        title="Masuk dengan WhatsApp"
        description="Masukkan nomor WhatsApp dan Kode Keamanan yang diberikan di grup angkatan."
        submitLabel="Masuk"
        onAuthenticated={async (result) => {
          if (!result.role) {
            router.push("/daftar");
            router.refresh();
            return;
          }
          finish();
        }}
      />

      {googleEnabled && (
        <p className="text-center text-[11px] leading-relaxed text-stone-400">
          Masuk dengan Google tetap memerlukan nomor WhatsApp sekali pada
          pengguna baru.
        </p>
      )}
    </div>
  );
}
