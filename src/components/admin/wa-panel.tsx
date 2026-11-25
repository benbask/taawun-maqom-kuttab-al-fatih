"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface WaInfo {
  session: {
    status: string;
    qr: string | null;
    connected_phone: string | null;
    last_heartbeat: string | null;
    last_error: string | null;
  };
  qrImage: string | null;
  otps: Array<{
    id: string;
    phone: string;
    status: string;
    attempts: number;
    code: string | null;
    message: string | null;
    manualUrl: string | null;
    created_at: string;
    expires_at: string;
    sent_at: string | null;
    worker_error: string | null;
  }>;
  workerOnline: boolean;
  adminWhatsapp: string;
  serverTime: string;
}

export function WaPanel() {
  const router = useRouter();
  const [data, setData] = useState<WaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/wa", { cache: "no-store" });
      if (!response.ok) return;
      const json = (await response.json()) as { ok?: boolean } & WaInfo;
      if (json.ok) setData(json);
    } catch {
      // abaikan, coba lagi
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => void load(), 12_000);
    return () => clearInterval(timer);
  }, [load]);

  async function post(actionName: "logout" | "reset") {
    if (
      actionName === "reset" &&
      !window.confirm("Reset sesi WhatsApp? QR harus dipindai ulang.")
    )
      return;
    setAction(actionName);
    try {
      const response = await fetch("/api/admin/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName }),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !json.ok) {
        toast.error(json.error ?? "Gagal memproses aksi.");
        return;
      }
      toast.success(
        actionName === "logout" ? "Permintaan keluar dikirim." : "Sesi direset.",
      );
      await load();
      router.refresh();
    } finally {
      setAction(null);
    }
  }

  if (loading && !data) {
    return (
      <Card className="flex items-center justify-center gap-2 p-10 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat status WhatsApp...
      </Card>
    );
  }

  const status = data?.session.status ?? "disconnected";
  const online = Boolean(data?.workerOnline);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                Status worker
              </p>
              <p className="mt-1 text-lg font-extrabold text-emerald-950">
                {online
                  ? "Terhubung"
                  : status === "qr"
                    ? "Menunggu scan QR"
                    : status === "connecting"
                      ? "Menghubungkan..."
                      : status === "error"
                        ? "Error"
                        : "Belum aktif"}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                {data?.session.connected_phone ?? "Belum ada nomor terhubung"}
              </p>
            </div>
            <span
              className={cn(
                "mt-1 h-3 w-3 rounded-full",
                online
                  ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                  : "bg-stone-300",
              )}
            />
          </div>

          {status === "qr" && data?.qrImage && (
            <div className="mt-4 flex flex-col items-center">
              <div className="rounded-xl border border-stone-200 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.qrImage} alt="QR login WhatsApp" className="h-48 w-48" />
              </div>
              <p className="mt-2 text-center text-xs text-stone-500">
                Pindai dengan WhatsApp → Perangkat tertaut.
              </p>
            </div>
          )}

          {data?.session.last_error && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {data.session.last_error}
            </p>
          )}

          <div className="mt-4 space-y-1 text-[11px] text-stone-500">
            <p>Heartbeat: {formatDateTime(data?.session.last_heartbeat)}</p>
            <p>Waktu server: {data?.serverTime}</p>
          </div>

          <div className="mt-4 grid gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Segarkan
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void post("logout")}
              disabled={Boolean(action)}
            >
              {action === "logout" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageCircle className="h-3.5 w-3.5" />
              )}
              Keluar dari WhatsApp
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void post("reset")}
              disabled={Boolean(action)}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset sesi
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-stone-900">Antrean OTP</p>
              <p className="text-xs text-stone-500">
                {data?.otps.length ?? 0} permintaan terakhir
              </p>
              {!online && !data?.adminWhatsapp && (
                <p className="mt-1 text-[11px] font-semibold text-amber-700">
                  Nomor WhatsApp admin belum diatur. Isi di menu QRIS &amp;
                  Pengaturan supaya OTP bisa dikirim manual.
                </p>
              )}
            </div>
            <Badge tone={online ? "green" : "amber"}>
              {online ? "Worker aktif" : "Mode manual"}
            </Badge>
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="sticky top-0 bg-stone-50/90 backdrop-blur">
                <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500">
                  <th className="px-4 py-2.5 font-semibold">WhatsApp</th>
                  <th className="px-4 py-2.5 font-semibold">Kode</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Waktu</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data?.otps.map((otp) => (
                  <tr key={otp.id}>
                    <td className="px-4 py-3 font-mono text-xs text-stone-700">
                      +{otp.phone}
                    </td>
                    <td className="px-4 py-3">
                      {otp.code ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold tracking-[0.2em] text-emerald-800">
                            {otp.code}
                          </span>
                          <button
                            type="button"
                            title="Salin kode"
                            aria-label="Salin kode OTP"
                            onClick={() => {
                              void navigator.clipboard.writeText(otp.code ?? "");
                              toast.success("Kode OTP disalin.");
                            }}
                            className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-emerald-700 active:translate-y-px"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          otp.status === "sent" || otp.status === "verified"
                            ? "bg-emerald-100 text-emerald-800"
                            : otp.status === "failed"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800",
                        )}
                      >
                        {otp.status === "sent" || otp.status === "verified" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : otp.status === "failed" ? (
                          <XCircle className="h-3 w-3" />
                        ) : null}
                        {otp.status}
                      </span>
                      {otp.worker_error && (
                        <p className="mt-1 max-w-[180px] truncate text-[10px] text-rose-600">
                          {otp.worker_error}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-stone-500">
                      {formatDateTime(otp.created_at)}
                      <p className="text-[10px] text-stone-400">
                        {otp.attempts} percobaan
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {otp.manualUrl && (
                        <a
                          href={otp.manualUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                        >
                          Kirim manual <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {!data?.otps.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-500">
                      Belum ada permintaan OTP.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/70 p-5 text-xs leading-relaxed text-amber-900">
        <p className="font-bold">Catatan keamanan</p>
        <p className="mt-1">
          Kode OTP hanya ditampilkan kepada admin di halaman ini. Jangan
          membagikannya ke selain pemilik nomor. Jika worker offline, gunakan
          tombol “Kirim manual” untuk mengirim pesan melalui WhatsApp admin.
        </p>
      </Card>
    </div>
  );
}
