import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Plus,
  QrCode,
  ScrollText,
  Users,
  Wallet,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import {
  formatDateTime,
  formatPhone,
  formatRupiah,
  invoiceStatusLabel,
  invoiceStatusTone,
} from "@/lib/format";
import { getStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isWaWorkerOnline } from "@/lib/wa-status";

export const metadata: Metadata = {
  title: "Ringkasan Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const store = getStore();
  const [stats, invoices, wa] = await Promise.all([
    store.getPublicStats({ includeDemo: true }),
    store.listAllInvoices({ includeDemo: true }),
    store.getWaSession(),
  ]);

  const waiting = invoices.filter((invoice) => invoice.status === "waiting_verification");
  const pending = invoices.filter((invoice) => invoice.status === "pending");
  const verified = invoices.filter((invoice) => invoice.status === "verified");
  const recent = invoices.slice(0, 6);
  const workerOnline = isWaWorkerOnline(wa);

  return (
    <div>
      <PageHeader
        eyebrow="Panel admin"
        title="Ringkasan Ta'awun"
        description="Pantau pembayaran masuk, verifikasi bukti, dan status WhatsApp dalam satu tempat."
        actions={
          <>
            <Link href="/admin/verifikasi" className={buttonClasses("primary", "sm")}>
              <BadgeCheck className="h-3.5 w-3.5" /> Verifikasi
              {waiting.length > 0 && (
                <span className="rounded-full bg-amber-300 px-1.5 text-[10px] font-black text-amber-950">
                  {waiting.length}
                </span>
              )}
            </Link>
            <Link href="/admin/export" className={buttonClasses("outline", "sm")}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Ekspor
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total terkumpul"
          value={formatRupiah(stats.total)}
          note={`Termasuk menunggu verifikasi & kode unik`}
          tone="emerald"
        />
        <StatCard
          icon={Clock}
          label="Menunggu verifikasi"
          value={String(waiting.length)}
          note={`${pending.length} belum dibayar`}
          tone="amber"
        />
        <StatCard
          icon={BadgeCheck}
          label="Invoice terverifikasi"
          value={String(verified.length)}
          note={`${invoices.length} total invoice`}
          tone="sky"
        />
        <StatCard
          icon={Users}
          label="Donatur"
          value={String(stats.donorCount)}
          note={`${stats.studentCount} santri tercatat`}
          tone="stone"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Invoice terbaru</h2>
              <p className="text-xs text-stone-500">6 transaksi terakhir</p>
            </div>
            <Link
              href="/admin/verifikasi"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              Semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/70 text-left text-[11px] uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-2.5 font-semibold">Invoice</th>
                  <th className="px-5 py-2.5 font-semibold">Wali</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recent.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-stone-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/invoice/${invoice.id}`}
                        className="font-mono text-xs font-bold text-emerald-800 hover:underline"
                      >
                        {invoice.invoice_no}
                      </Link>
                      <p className="mt-0.5 text-[10px] text-stone-400">
                        {formatDateTime(invoice.created_at)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-stone-700">
                        <Link
                          href={`/admin/ots/${invoice.family_id}`}
                          className="hover:text-emerald-700 hover:underline"
                        >
                          {invoice.family.parent_name}
                        </Link>
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {formatPhone(invoice.family.phone)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                          invoiceStatusTone(invoice.status),
                        )}
                      >
                        {invoiceStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-bold text-stone-800">
                      {formatRupiah(invoice.total_amount)}
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-stone-500">
                      Belum ada invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                  WhatsApp OTP
                </p>
                <p className="mt-1 text-sm font-bold text-stone-900">
                  {workerOnline
                    ? "Worker terhubung"
                    : wa.status === "qr"
                      ? "Menunggu scan QR"
                      : "Worker belum aktif"}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {wa.connected_phone
                    ? formatPhone(wa.connected_phone)
                    : "Belum ada nomor terhubung"}
                </p>
              </div>
              <span
                className={cn(
                  "mt-0.5 h-3 w-3 rounded-full",
                  workerOnline
                    ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                    : "bg-stone-300",
                )}
              />
            </div>
            <p className="mt-3 text-[11px] text-stone-400">
              Heartbeat terakhir: {formatDateTime(wa.last_heartbeat)}
            </p>
            {!workerOnline && wa.last_error && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-900">
                {wa.last_error}
              </p>
            )}
            <Link
              href="/admin/whatsapp"
              className={buttonClasses("outline", "sm", "mt-3 w-full")}
            >
              <MessageCircle className="h-3.5 w-3.5" /> Kelola WhatsApp
            </Link>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
              Aksi cepat
            </p>
            <div className="mt-3 grid gap-2">
              <QuickLink href="/admin/konten" icon={ScrollText} label="Ubah konten beranda" />
              <QuickLink href="/admin/kelas" icon={GraduationCap} label="Kelola kelas" />
              <QuickLink href="/admin/qris" icon={QrCode} label="Atur QRIS statis" />
              <QuickLink href="/admin/form" icon={LayoutDashboard} label="Kelola formulir" />
              <QuickLink href="/admin/kehadiran" icon={UserCheck} label="Daftar hadir ayah" />
              <QuickLink href="/admin/export" icon={FileSpreadsheet} label="Ekspor XLSX / Sheets" />
            </div>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/70 p-5">
            <Badge tone="green">
              <BadgeCheck className="h-3 w-3" /> Rekap publik
            </Badge>
            <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
              Total yang tampil di beranda hanya berasal dari invoice berstatus
              terverifikasi. Kode unik tidak dihitung sebagai Ta&apos;awun pokok.
            </p>
            <Link
              href="/"
              target="_blank"
              className={buttonClasses("secondary", "sm", "mt-3 w-full")}
            >
              Lihat beranda <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </div>

      {waiting.length > 0 && (
        <Card className="mt-6 overflow-hidden border-amber-200">
          <div className="flex items-center justify-between gap-2 bg-amber-50 px-5 py-3">
            <p className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
              <Clock className="h-4 w-4" /> {waiting.length} bukti menunggu verifikasi
            </p>
            <Link
              href="/admin/verifikasi?status=waiting_verification"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline"
            >
              Periksa <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {waiting.slice(0, 4).map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoice/${invoice.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-amber-50/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-800">
                    {invoice.family.parent_name}
                  </p>
                  <p className="font-mono text-[10px] text-stone-400">
                    {invoice.invoice_no}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-stone-900">
                  {formatRupiah(invoice.total_amount)}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MiniStat icon={Plus} label="Kelas aktif" value={String((await store.listClasses(true)).length)} />
        <MiniStat icon={Users} label="Total invoice" value={String(invoices.length)} />
        <MiniStat
          icon={Wallet}
          label="Rata-rata terverifikasi"
          value={
            verified.length
              ? formatRupiah(
                  Math.round(
                    verified.reduce((total, invoice) => total + invoice.base_amount, 0) /
                      verified.length,
                  ),
                )
              : "—"
          }
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "sky" | "stone";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    stone: "bg-stone-100 text-stone-600 ring-stone-200",
  } as const;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-stone-500">{label}</p>
          <p className="mt-1 text-xl font-extrabold tracking-tight text-stone-900">{value}</p>
          <p className="mt-0.5 text-[11px] text-stone-400">{note}</p>
        </div>
        <span className={cn("rounded-xl p-2 ring-1", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Wallet;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-600 hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-800"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
      <ArrowRight className="ml-auto h-3 w-3" />
    </Link>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5">
      <span className="rounded-lg bg-stone-100 p-1.5 text-stone-500">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
          {label}
        </p>
        <p className="text-sm font-bold text-stone-800">{value}</p>
      </div>
    </div>
  );
}
