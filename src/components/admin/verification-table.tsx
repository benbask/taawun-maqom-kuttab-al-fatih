"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  BadgeCheck,
  ExternalLink,
  Eye,
  Loader2,
  MessageCircle,
  Receipt,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { buttonClasses } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  formatDateTime,
  formatPhone,
  formatRupiah,
  invoiceStatusLabel,
  invoiceStatusTone,
  waLink,
} from "@/lib/format";
import type { InvoiceWithDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VerificationTable({
  invoices,
}: {
  invoices: InvoiceWithDetails[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<InvoiceWithDetails | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadProof() {
    if (!selected || !proofFile) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", proofFile);
      const response = await fetch(`/api/invoice/${selected.id}/proof`, {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        uploadedAt?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal mengunggah bukti.");
        return;
      }
      toast.success("Bukti transfer berhasil diunggah.");
      setSelected({
        ...selected,
        proof_url: `/api/invoice/${selected.id}/proof/file`,
        proof_uploaded_at: data.uploadedAt ?? new Date().toISOString(),
        status: "waiting_verification",
      });
      setProofFile(null);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setUploading(false);
    }
  }

  async function decide(
    status: "verified" | "rejected" | "cancelled" | "pending" | "waiting_verification",
  ) {
    if (!selected) return;
    if (status === "rejected" && !reason.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setLoading(status);
    setError(null);
    try {
      const response = await fetch(`/api/admin/invoices/${selected.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: reason.trim() || null }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        sheets?: { ok: boolean; error?: string } | null;
      };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal mengubah status.");
        return;
      }
      const messages = {
        verified: "Pembayaran terverifikasi.",
        rejected: "Bukti ditolak.",
        cancelled: "Invoice dibatalkan.",
        pending: "Status diubah menjadi belum bayar.",
        waiting_verification: "Status diubah menjadi menunggu verifikasi.",
      } as const;
      toast.success(messages[status]);
      if (status === "verified" && data.sheets && !data.sheets.ok) {
        toast.warning(`Sinkron Sheets gagal: ${data.sheets.error}`);
      }
      setSelected(null);
      setReason("");
      setProofFile(null);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70 text-left text-[11px] uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3 font-semibold">Invoice</th>
              <th className="px-4 py-3 font-semibold">Wali &amp; santri</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Bukti</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {invoices.map((invoice) => {
              const waiting = invoice.status === "waiting_verification";
              const proofUrl = `/api/invoice/${invoice.id}/proof/file`;
              const isPdf =
                invoice.proof_url?.toLowerCase().includes(".pdf") ||
                invoice.proof_url?.toLowerCase().startsWith("data:application/pdf");
              return (
                <tr key={invoice.id} className="bg-white hover:bg-stone-50/50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-emerald-800">
                      {invoice.invoice_no}
                      {invoice.is_demo && (
                        <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 font-sans text-[9px] font-bold text-amber-800">
                          DEMO
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[10px] text-stone-400">
                      {formatDateTime(invoice.created_at)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-stone-800">
                      <Link
                        href={`/admin/ots/${invoice.family_id}`}
                        className="hover:text-emerald-700 hover:underline"
                      >
                        {invoice.family.parent_name}
                      </Link>
                    </p>
                    <p className="text-[10px] text-stone-400">
                      <a
                        href={waLink(invoice.family.phone, `Assalamu'alaikum ${invoice.family.parent_name}, ...`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-emerald-700 hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" />
                        {formatPhone(invoice.family.phone)}
                      </a>
                    </p>
                    <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-stone-500">
                      {invoice.items
                        .map((item) => item.student?.name ?? item.description ?? "-")
                        .join(", ")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        invoiceStatusTone(invoice.status),
                      )}
                    >
                      {invoiceStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {invoice.proof_url ? (
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isPdf ? "PDF" : "Lihat"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-stone-400">Belum ada</span>
                    )}
                    {invoice.proof_uploaded_at && (
                      <p className="mt-0.5 text-[10px] text-stone-400">
                        {formatDateTime(invoice.proof_uploaded_at)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-stone-800">
                    {formatRupiah(invoice.total_amount)}
                    <p className="text-[10px] font-normal text-stone-400">
                      pokok {formatRupiah(invoice.base_amount)} + {invoice.unique_code}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(invoice);
                          setReason("");
                          setProofFile(null);
                          setError(null);
                        }}
                        className={buttonClasses("primary", "sm")}
                      >
                        {waiting ? "Periksa" : "Ubah status"}
                      </button>
                      <a
                        href={`/invoice/${invoice.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClasses("ghost", "sm")}
                      >
                        Buka
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-stone-300" />
                  <p className="mt-2 text-sm font-semibold text-stone-600">
                    Tidak ada invoice pada filter ini.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-emerald-950">
                  Periksa bukti transfer
                </h3>
                <p className="mt-0.5 font-mono text-xs text-stone-500">
                  {selected.invoice_no} • {formatRupiah(selected.total_amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
                aria-label="Tutup"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
              <p>
                <Link
                  href={`/admin/ots/${selected.family.id}`}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  {selected.family.parent_name}
                </Link>{" "}
                •{" "}
                <a
                  href={waLink(selected.family.phone, `Assalamu'alaikum ${selected.family.parent_name}, ...`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                >
                  <MessageCircle className="h-3 w-3" />
                  {formatPhone(selected.family.phone)}
                </a>
              </p>
              <p className="mt-1">
                Kode unik: <strong className="text-amber-700">{selected.unique_code}</strong>{" "}
                • Pokok: {formatRupiah(selected.base_amount)}
              </p>
              <p className="mt-1">
                Diunggah: {formatDateTime(selected.proof_uploaded_at)}
              </p>
            </div>

            {selected.proof_url ? (
              <a
                href={`/api/invoice/${selected.id}/proof/file`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("outline", "sm", "mt-3 w-full")}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Buka bukti ukuran penuh
              </a>
            ) : (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Bukti transfer belum diunggah.
              </p>
            )}

            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="text-xs font-bold text-emerald-950">
                Unggah bukti sebagai admin
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-900 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
              />
              {proofFile && (
                <p className="mt-1 truncate text-[11px] text-stone-500">
                  {proofFile.name}
                </p>
              )}
              <button
                type="button"
                onClick={uploadProof}
                disabled={!proofFile || uploading || Boolean(loading)}
                className={buttonClasses("secondary", "sm", "mt-2 w-full")}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Unggah bukti
              </button>
            </div>

            <div className="mt-4">
              <label
                htmlFor="reject-reason"
                className="text-xs font-bold text-stone-700"
              >
                Alasan penolakan (wajib jika ditolak)
              </label>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                placeholder="Contoh: nominal tidak sesuai / bukti kurang jelas"
                className="mt-1.5 min-h-20 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

            {error && (
              <div className="mt-3">
                <FieldError>{error}</FieldError>
              </div>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              <button
                type="button"
                onClick={() => decide("verified")}
                disabled={Boolean(loading)}
                className={buttonClasses("primary", "sm")}
              >
                {loading === "verified" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <BadgeCheck className="h-3.5 w-3.5" />
                )}
                Verifikasi
              </button>
              <button
                type="button"
                onClick={() => decide("rejected")}
                disabled={Boolean(loading)}
                className={buttonClasses("outline", "sm", "border-rose-200 text-rose-700")}
              >
                {loading === "rejected" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Tolak
              </button>
              <button
                type="button"
                onClick={() => decide("cancelled")}
                disabled={Boolean(loading)}
                className={buttonClasses("ghost", "sm")}
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => decide("waiting_verification")}
                disabled={Boolean(loading)}
                className={buttonClasses("outline", "sm")}
              >
                {loading === "waiting_verification" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Menunggu verifikasi
              </button>
              <button
                type="button"
                onClick={() => decide("pending")}
                disabled={Boolean(loading)}
                className={buttonClasses("ghost", "sm")}
              >
                {loading === "pending" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Belum bayar
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
              Verifikasi akan memperbarui rekap publik dan mencoba sinkron ke
              Google Sheets jika webhook diatur.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
