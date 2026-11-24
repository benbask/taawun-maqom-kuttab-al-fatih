"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RoleSelector } from "@/components/public/role-selector";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";
import { formatPhone } from "@/lib/format";
import type { AccountRole } from "@/lib/account-roles";
import { cn } from "@/lib/utils";

interface OtpRequestResponse {
  ok?: boolean;
  error?: string;
  phone?: string;
  expiresInMinutes?: number;
  workerOnline?: boolean;
  demoCode?: string | null;
  manualUrl?: string | null;
  message?: string;
  needsRole?: boolean;
  role?: AccountRole | null;
}

interface VerifiedResult {
  phone: string;
  familyId: string | null;
  role: AccountRole | null;
}

export function PhoneOtpPanel({
  initialPhone = "",
  title = "Verifikasi WhatsApp",
  description = "Kami mengirim kode OTP 4 digit ke WhatsApp Anda.",
  submitLabel = "Kirim kode OTP",
  askRole = true,
  onVerified,
}: {
  initialPhone?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  /** Tampilkan pilihan peran otomatis setelah OTP. Matikan bila form sudah punya langkah sendiri. */
  askRole?: boolean;
  onVerified: (result: VerifiedResult) => void | Promise<void>;
}) {
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [normalized, setNormalized] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] =
    useState<VerifiedResult | null>(null);
  const [workerOnline, setWorkerOnline] = useState<boolean | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(10);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const response = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await response.json()) as OtpRequestResponse;
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal mengirim kode OTP.");
        return;
      }

      setNormalized(data.phone ?? phone);
      setStage("otp");
      setWorkerOnline(Boolean(data.workerOnline));
      setDemoCode(data.demoCode ?? null);
      setManualUrl(data.manualUrl ?? null);
      setExpiresIn(data.expiresInMinutes ?? 10);
      setSeconds(60);
      setInfo(data.message ?? null);
      if (data.demoCode) {
        setCode(data.demoCode);
        toast.info(`Mode demo: kode OTP ${data.demoCode}`);
      }
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{4}$/.test(code)) {
      setError("Kode OTP harus 4 digit.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, code }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        familyId?: string | null;
        phone?: string;
        attemptsLeft?: number;
        needsRole?: boolean;
        role?: AccountRole | null;
      };
      if (!response.ok || !data.ok) {
        setError(
          data.error ??
            "Kode salah." + (data.attemptsLeft !== undefined ? ` Sisa ${data.attemptsLeft} percobaan.` : ""),
        );
        return;
      }
      toast.success("Nomor WhatsApp terverifikasi.");
      const result: VerifiedResult = {
        phone: data.phone ?? normalized,
        familyId: data.familyId ?? null,
        role: data.role ?? null,
      };
      if (data.needsRole && askRole) {
        setPendingVerification(result);
        return;
      }
      await onVerified(result);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <RoleSelector
        onDone={async (role) => {
          const verified = { ...pendingVerification, role };
          setPendingVerification(null);
          await onVerified(verified);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-100">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-emerald-950">{title}</h2>
          <p className="mt-0.5 text-sm leading-relaxed text-stone-500">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StepDot active={stage === "phone"} done={stage === "otp"} label="Nomor" />
        <span className="h-px flex-1 bg-stone-200" />
        <StepDot active={stage === "otp"} done={false} label="Kode OTP" />
      </div>

      {stage === "phone" ? (
        <form onSubmit={requestCode} className="space-y-3">
          <div>
            <Label htmlFor="otp-phone">Nomor WhatsApp</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">
                +62
              </span>
              <Input
                id="otp-phone"
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
              Gunakan nomor yang aktif di WhatsApp. Format 08xx atau 62xx.
            </FieldHint>
          </div>

          {error && <FieldError>{error}</FieldError>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )}
            {submitLabel}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
            <p className="font-semibold">
              Kode dikirim ke <span className="font-mono">{formatPhone(normalized)}</span>
            </p>
            <p className="mt-0.5 text-emerald-800/70">
              Berlaku {expiresIn} menit. Jangan bagikan kode kepada siapa pun.
            </p>
          </div>

          {demoCode && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-bold">Mode demo</p>
              <p>
                Kode OTP Anda:{" "}
                <span className="font-mono text-base font-bold tracking-[0.3em]">
                  {demoCode}
                </span>
              </p>
            </div>
          )}

          {workerOnline === false && !demoCode && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              <p className="font-bold">Worker WhatsApp belum aktif</p>
              <p className="mt-0.5">
                Kode tetap dibuat dan akan dikirim admin secara manual. Anda bisa
                menghubungi admin untuk mempercepat.
              </p>
              {manualUrl && (
                <a
                  href={manualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-bold underline underline-offset-2"
                >
                  Hubungi admin <ArrowRight className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="otp-code">Kode OTP</Label>
            <Input
              id="otp-code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              className="text-center text-2xl font-bold tracking-[0.5em]"
              required
            />
          </div>

          {info && !demoCode && <p className="text-xs text-stone-500">{info}</p>}
          {error && <FieldError>{error}</FieldError>}

          <Button type="submit" className="w-full" disabled={loading || code.length !== 4}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Verifikasi &amp; lanjutkan
          </Button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setStage("phone");
                setCode("");
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Ubah nomor
            </button>
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={seconds > 0 || loading}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                seconds > 0 ? "text-stone-400" : "text-emerald-700 hover:text-emerald-900",
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {seconds > 0 ? `Kirim ulang (${seconds}s)` : "Kirim ulang kode"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
          done
            ? "bg-emerald-600 text-white"
            : active
              ? "bg-emerald-900 text-white"
              : "bg-stone-200 text-stone-500",
        )}
      >
        {done ? "✓" : active ? "•" : ""}
      </span>
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-wide",
          active || done ? "text-emerald-900" : "text-stone-400",
        )}
      >
        {label}
      </span>
    </span>
  );
}
