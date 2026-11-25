import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Info,
  QrCode,
  Receipt,
  ScanLine,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InvoiceCountdown, InvoiceStatusPoller } from "@/components/public/invoice-status";
import { InvoiceProofUploader } from "@/components/public/invoice-proof-uploader";
import { ProofUploadTrigger } from "@/components/public/proof-upload-trigger";
import {
  formatDateTime,
  formatRupiah,
  invoiceStatusLabel,
  invoiceStatusTone,
} from "@/lib/format";
import { qrDataUrl } from "@/lib/qr-image";
import { safeSettings } from "@/lib/safe";
import { getAdminSession, getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pembayaran Ta'awun",
  robots: { index: false, follow: false },
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getStore();
  const [invoice, settings] = await Promise.all([
    store.getInvoiceById(id).catch(() => null),
    safeSettings(),
  ]);

  if (!invoice) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="rounded-2xl bg-stone-100 p-4 text-stone-400">
          <FileText className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-stone-800">
          Invoice tidak ditemukan
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Periksa kembali tautan invoice Anda, atau buka riwayat dari akun.
        </p>
        <Link href="/akun" className={buttonClasses("primary", "md", "mt-5")}>
          Buka akun saya
        </Link>
      </div>
    );
  }

  const [user, admin] = await Promise.all([getUserSession(), getAdminSession()]);
  const familyId = user
    ? user.familyId ?? (await store.getFamilyByPhone(user.phone).catch(() => null))?.id
    : null;
  const isOwner = Boolean(familyId && invoice.family_id === familyId);
  const isAdmin = Boolean(admin);
  const canUpload =
    (isOwner || isAdmin) && ["pending", "expired", "rejected"].includes(invoice.status);

  let qr = null;
  if (invoice.qris_payload && ["pending", "expired", "rejected"].includes(invoice.status)) {
    qr = await qrDataUrl(invoice.qris_payload).catch(() => null);
  }

  const proofIsPdf =
    invoice.proof_url?.toLowerCase().includes(".pdf") ||
    invoice.proof_url?.toLowerCase().startsWith("data:application/pdf") ||
    false;
  const proofUrl = `/api/invoice/${invoice.id}/proof/file`;
  const canSeeProof = (isOwner || isAdmin) && Boolean(invoice.proof_url);
  const qrisOwner =
    settings.qris_merchant_name?.trim() || settings.site_name || "Penerima QRIS";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <InvoiceStatusPoller
        invoiceId={invoice.id}
        initialStatus={invoice.status}
        enabled={isOwner || isAdmin}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={isAdmin ? "/admin/verifikasi" : "/akun"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" /> {isAdmin ? "Kembali ke verifikasi" : "Kembali ke akun"}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <InvoiceCountdown expiresAt={invoice.expires_at} status={invoice.status} />
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold",
              invoiceStatusTone(invoice.status),
            )}
          >
            {invoiceStatusLabel(invoice.status)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-4">
          {qr ? (
            <Card className="overflow-hidden">
              <div className="bg-emerald-950 px-5 py-4 text-emerald-50">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300/80">
                  <QrCode className="h-3.5 w-3.5" /> QRIS dinamis
                </p>
                <p className="mt-1 text-sm text-emerald-100/70">
                  {invoice.family.parent_name} • {invoice.invoice_no}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <p className="text-sm font-semibold leading-relaxed text-emerald-900">
                  Pastikan penerima QRIS:{" "}
                  <span className="font-extrabold">{qrisOwner}</span>
                </p>
              </div>

              <div className="px-5 pt-4">
                <ProofUploadTrigger />
              </div>

              <div className="flex flex-col items-center px-5 py-6">
                <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qr}
                    alt={`QRIS pembayaran ${invoice.invoice_no}`}
                    className="h-56 w-56 sm:h-64 sm:w-64"
                  />
                </div>
                <p className="mt-3 text-center text-xs text-stone-500">
                  Scan dengan aplikasi bank atau e-wallet yang mendukung QRIS.
                </p>
                <a
                  href={qr}
                  download={`qris-${invoice.invoice_no}.png`}
                  className={buttonClasses("outline", "sm", "mt-3")}
                >
                  <Download className="h-3.5 w-3.5" /> Unduh QR
                </a>
                <div className="mt-4 w-full max-w-sm">
                  <ProofUploadTrigger />
                </div>
              </div>

              <div className="border-t border-stone-100 bg-amber-50/60 px-5 py-3">
                <p className="text-xs font-semibold text-amber-900">
                  Total transfer:{" "}
                  <span className="font-extrabold text-amber-950">
                    {formatRupiah(invoice.total_amount)}
                  </span>
                </p>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <h2 className="text-sm font-bold text-stone-800">
                    QRIS belum tersedia
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">
                    QRIS dinamis belum bisa dibuat. Hubungi admin dengan
                    menyebutkan nomor invoice{" "}
                    <span className="font-mono font-bold">{invoice.invoice_no}</span>
                    , atau gunakan QRIS statis di halaman utama jika tersedia.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card
            className={cn(
              "p-5",
              canUpload
                ? "border-amber-300 bg-amber-50/50 shadow-sm ring-2 ring-amber-200/60"
                : "border-stone-200",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-amber-100 p-2 text-amber-800 ring-1 ring-amber-200">
                  <Upload className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-amber-950">
                    Unggah bukti transfer
                  </h2>
                  <p className="mt-0.5 text-xs text-amber-900/70">
                    Langkah terakhir setelah transfer. Jangan sampai terlewat.
                  </p>
                </div>
              </div>
              {canUpload && (
                <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-stone-950">
                  Penting
                </span>
              )}
            </div>

            <div className="mt-4">
              {canUpload && (
                <InvoiceProofUploader
                  invoiceId={invoice.id}
                  rejected={invoice.status === "rejected"}
                />
              )}

              {isOwner && invoice.status === "waiting_verification" && canSeeProof && (
                <ProofPreview
                  proofUrl={proofUrl}
                  isPdf={proofIsPdf}
                  uploadedAt={invoice.proof_uploaded_at}
                />
              )}

              {isOwner && invoice.status === "verified" && canSeeProof && (
                <ProofPreview
                  proofUrl={proofUrl}
                  isPdf={proofIsPdf}
                  uploadedAt={invoice.proof_uploaded_at}
                />
              )}

              {!user && (
                <div className="rounded-xl border border-stone-200 bg-white/80 p-4 text-center">
                  <p className="text-sm font-semibold text-stone-700">
                    Ingin mengunggah bukti transfer?
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Masuk dengan nomor WhatsApp yang didaftarkan.
                  </p>
                  <Link
                    href={`/masuk?next=/invoice/${invoice.id}`}
                    className={buttonClasses("primary", "sm", "mt-3")}
                  >
                    Masuk untuk unggah bukti
                  </Link>
                </div>
              )}

              {user && !isOwner && !isAdmin && (
                <p className="rounded-xl border border-amber-200 bg-white/80 p-3 text-xs text-amber-900">
                  Invoice ini terhubung dengan nomor WhatsApp lain. Masuk dengan
                  nomor yang sesuai untuk mengunggah bukti.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold text-stone-900">Rincian pembayaran</h2>
            <div className="mt-3 space-y-2 text-sm">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-800">
                      {item.student?.name ?? item.description ?? "Ta'awun"}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {item.class?.name ?? "Ta'awun umum"}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-stone-700">
                    {formatRupiah(item.amount)}
                  </span>
                </div>
              ))}
              <div className="border-t border-dashed border-stone-200 pt-2">
                <div className="flex items-center justify-between text-stone-500">
                  <span>Ta&apos;awun pokok</span>
                  <span className="font-semibold text-stone-700">
                    {formatRupiah(invoice.base_amount)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-stone-500">
                  <span>Kode unik audit</span>
                  <span className="font-semibold text-amber-700">
                    {formatRupiah(invoice.unique_code)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-2">
                  <span className="font-bold text-stone-900">Total transfer</span>
                  <span className="text-lg font-extrabold text-emerald-900">
                    {formatRupiah(invoice.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                  Invoice
                </p>
                <p className="mt-1 break-all font-mono text-sm font-bold text-emerald-900">
                  {invoice.invoice_no}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Dibuat {formatDateTime(invoice.created_at)}
                </p>
              </div>
              <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
                <Receipt className="h-5 w-5" />
              </span>
            </div>

            <div className="border-t border-stone-100 px-5 py-4">
              {invoice.status === "waiting_verification" && (
                <StatusPanel
                  tone="amber"
                  icon={Clock}
                  title="Bukti sedang diperiksa"
                  body="Admin akan memverifikasi bukti transfer Anda. Halaman ini otomatis diperbarui setelah terverifikasi."
                />
              )}
              {invoice.status === "verified" && (
                <StatusPanel
                  tone="green"
                  icon={BadgeCheck}
                  title="Ta'awun terverifikasi"
                  body={`Terima kasih. Pembayaran diverifikasi ${formatDateTime(invoice.verified_at)} dan telah tampil di rekap publik.`}
                />
              )}
              {invoice.status === "rejected" && (
                <StatusPanel
                  tone="rose"
                  icon={XCircle}
                  title="Bukti ditolak"
                  body={invoice.reject_reason ?? "Bukti transfer belum sesuai. Silakan unggah ulang."}
                />
              )}
              {invoice.status === "cancelled" && (
                <StatusPanel
                  tone="stone"
                  icon={XCircle}
                  title="Invoice dibatalkan"
                  body="Hubungi admin jika Anda sudah melakukan pembayaran."
                />
              )}
              {["pending", "expired"].includes(invoice.status) && (
                <StatusPanel
                  tone="sky"
                  icon={ShieldCheck}
                  title="Menunggu pembayaran"
                  body="Scan QRIS, transfer sesuai total, lalu unggah bukti di kotak kuning tepat di bawah QRIS."
                />
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold text-stone-900">Cara pembayaran</h2>
            <ol className="mt-3 space-y-3 text-xs text-stone-600">
              <Step icon={ScanLine} title="Scan QRIS" body="Buka aplikasi bank/e-wallet, pilih bayar QRIS, lalu scan kode di samping." />
              <Step icon={Banknote} title="Transfer tepat" body={`Masukkan nominal ${formatRupiah(invoice.total_amount)} tanpa dibulatkan.`} />
              <Step icon={Upload} title="Unggah bukti" body="Simpan screenshot transaksi berhasil, lalu unggah di kotak kuning tepat di bawah QRIS." />
              <Step icon={CheckCircle2} title="Tunggu verifikasi" body="Admin memverifikasi bukti. Setelah itu pembayaran tampil di rekap publik." />
            </ol>
          </Card>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-900">
            <p className="flex items-center gap-1.5 font-bold">
              <Info className="h-3.5 w-3.5" /> Simpan halaman ini
            </p>
            <p className="mt-1 text-emerald-900/75">
              Tautan invoice ini dapat dibuka kembali dari menu Akun Saya. Jangan
              bagikan bukti transfer Anda kepada pihak yang tidak berkepentingan.
            </p>
            <Link
              href={`/invoice/${invoice.id}`}
              className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-800 underline underline-offset-2"
            >
              Tautan invoice <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPanel({
  tone,
  icon: Icon,
  title,
  body,
}: {
  tone: "green" | "amber" | "rose" | "sky" | "stone";
  icon: typeof Clock;
  title: string;
  body: string;
}) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    stone: "border-stone-200 bg-stone-50 text-stone-700",
  } as const;

  return (
    <div className={cn("rounded-xl border p-3", tones[tone])}>
      <p className="flex items-center gap-1.5 text-sm font-bold">
        <Icon className="h-4 w-4" /> {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed opacity-80">{body}</p>
    </div>
  );
}

function ProofPreview({
  proofUrl,
  isPdf,
  uploadedAt,
}: {
  proofUrl: string;
  isPdf: boolean;
  uploadedAt: string | null;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-stone-600">
        Bukti terunggah {formatDateTime(uploadedAt)}
      </p>
      {isPdf ? (
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("outline", "sm", "w-full")}
        >
          <FileText className="h-3.5 w-3.5" /> Buka bukti PDF
        </a>
      ) : (
        <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofUrl}
            alt="Bukti transfer"
            className="max-h-64 w-full rounded-xl border border-stone-200 object-contain"
          />
        </a>
      )}
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ScanLine;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 rounded-lg bg-stone-100 p-1.5 text-stone-600">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span>
        <span className="block font-bold text-stone-800">{title}</span>
        {body}
      </span>
    </li>
  );
}
