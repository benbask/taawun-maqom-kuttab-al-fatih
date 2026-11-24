"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

export function InvoiceCountdown({
  expiresAt,
  status,
}: {
  expiresAt: string | null;
  status: string;
}) {
  const [left, setLeft] = useState<number>(() =>
    expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0,
  );

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      setLeft(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!expiresAt) return null;
  if (status === "verified" || status === "cancelled") return null;

  const expired = left <= 0;
  const hours = Math.floor(Math.max(0, left) / 3_600_000);
  const minutes = Math.floor((Math.max(0, left) % 3_600_000) / 60_000);
  const seconds = Math.floor((Math.max(0, left) % 60_000) / 1000);

  return (
    <p
      className={
        expired
          ? "inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700"
          : "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"
      }
    >
      <Clock className="h-3.5 w-3.5" />
      {expired
        ? "Batas pembayaran telah lewat"
        : `Bayar dalam ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
    </p>
  );
}

export function InvoiceStatusPoller({
  invoiceId,
  initialStatus,
  enabled,
}: {
  invoiceId: string;
  initialStatus: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (!enabled) return;
    if (!["pending", "waiting_verification"].includes(status)) return;

    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/invoice/${invoiceId}/status`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { status?: string };
        if (data.status && data.status !== status) {
          setStatus(data.status);
          router.refresh();
        }
      } catch {
        // abaikan, coba lagi pada interval berikutnya
      }
    }, 15_000);

    return () => clearInterval(timer);
  }, [enabled, invoiceId, router, status]);

  return null;
}
