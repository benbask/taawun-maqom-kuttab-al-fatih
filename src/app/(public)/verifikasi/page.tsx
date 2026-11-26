import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Clock,
  GraduationCap,
  Info,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { ClassSelect } from "@/components/public/class-select";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrintButton } from "@/components/site/print-button";
import {
  formatDateTime,
  formatRupiah,
  maskName,
  maskPhone,
  waLink,
} from "@/lib/format";
import { safePublicStats, safeSettings } from "@/lib/safe";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Verifikasi Ta'awun Publik",
  description:
    "Rekap pembayaran Ta'awun Maqom Kuttab Al Fatih Lampung yang bukti transfernya sudah diunggah, lengkap dengan status verifikasi, nama tersamarkan, dan waktu unggah bukti.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <Badge tone="green" className="text-[10px]">
        <BadgeCheck className="h-3 w-3" /> Terverifikasi
      </Badge>
    );
  }
  return (
    <Badge tone="amber" className="text-[10px]">
      <Clock className="h-3 w-3" /> Menunggu verifikasi
    </Badge>
  );
}

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selected = first(params.kelas) ?? null;
  const settings = await safeSettings();
  const store = getStore();

  let data;
  try {
    data = await store.getVerificationData(selected);
  } catch (error) {
    console.error("[verifikasi] gagal memuat data:", error);
    data = {
      classes: [],
      selectedClassId: null,
      selectedClassName: null,
      rows: [],
      classTotal: 0,
      classCount: 0,
    };
  }

  const stats = await safePublicStats(settings.target_amount);
  const percent = stats.target > 0 ? Math.round((stats.total / stats.target) * 100) : 0;
  const verifiedCount = data.rows.filter((row) => row.status === "verified").length;
  const waitingCount = data.rows.length - verifiedCount;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="no-print mb-6 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>
        <PrintButton />
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="green">
              <ShieldCheck className="h-3.5 w-3.5" /> Halaman publik
            </Badge>
            <span className="text-xs font-semibold text-stone-400">
              {settings.site_name}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
            Rekap &amp; Verifikasi Ta&apos;awun
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500">
            Ringkasan dana Ta&apos;awun, rekap per kelas, dan rincian pembayaran
            yang bukti transfernya sudah diunggah. Nama dan nomor WhatsApp
            ditampilkan tersamarkan untuk menjaga privasi.
          </p>
        </div>
        <div className="w-full rounded-2xl border border-emerald-900/10 bg-emerald-950 px-5 py-4 text-emerald-50 shadow-sm sm:w-64">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300/80">
            Kelas terpilih
          </p>
          <ClassSelect classes={data.classes} selectedId={data.selectedClassId} />
          <p className="mt-2 text-2xl font-extrabold">{formatRupiah(data.classTotal)}</p>
          <p className="text-xs text-emerald-100/60">
            {data.classCount} pembayaran tercatat
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-extrabold text-emerald-950">
          Ringkasan keseluruhan
        </h2>
        <span className="text-[11px] text-stone-400">
          {stats.lastUpdated
            ? `Diperbarui ${formatDateTime(stats.lastUpdated)}`
            : "Belum ada pembayaran terverifikasi"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
              <Wallet className="h-3.5 w-3.5" />
            </span>
            Total terkumpul
          </div>
          <p className="mt-2 text-lg font-extrabold tabular-nums text-emerald-950 sm:text-xl">
            {formatRupiah(stats.total)}
          </p>
          <p className="text-[11px] text-stone-400">Termasuk menunggu verifikasi</p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
              <Target className="h-3.5 w-3.5" />
            </span>
            Target Ta&apos;awun
          </div>
          <p className="mt-2 text-lg font-extrabold tabular-nums text-emerald-950 sm:text-xl">
            {formatRupiah(stats.target)}
          </p>
          <p className="text-[11px] text-stone-400">{percent}% tercapai</p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="rounded-lg bg-sky-100 p-1.5 text-sky-700">
              <Users className="h-3.5 w-3.5" />
            </span>
            Kontribusi
          </div>
          <p className="mt-2 text-lg font-extrabold tabular-nums text-emerald-950 sm:text-xl">
            {stats.donorCount} keluarga
          </p>
          <p className="text-[11px] text-stone-400">Ayah / donatur umum</p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="rounded-lg bg-violet-100 p-1.5 text-violet-700">
              <GraduationCap className="h-3.5 w-3.5" />
            </span>
            Data anak
          </div>
          <p className="mt-2 text-lg font-extrabold tabular-nums text-emerald-950 sm:text-xl">
            {stats.studentCount} anak
          </p>
          <p className="text-[11px] text-stone-400">Untuk rekap per kelas</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-stone-400">
        Total di atas termasuk kode unik audit: {formatRupiah(stats.uniqueCodeTotal)}.
      </p>

      {stats.perClass.length > 0 && (
        <Card className="mt-5 overflow-hidden">
          <div className="border-b border-stone-100 bg-stone-50/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                <Receipt className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-stone-900">Rekap per kelas</h2>
                <p className="text-xs text-stone-500">
                  Klik nama kelas untuk melihat rincian pembayaran.
                </p>
              </div>
            </div>
          </div>
          <>
            <div className="no-print divide-y divide-stone-100 sm:hidden">
              {stats.perClass.map((row) => (
                <div key={row.classId} className="flex items-center justify-between gap-3 px-5 py-3">
                  <Link
                    href={`/verifikasi?kelas=${row.classId}`}
                    className="min-w-0 font-semibold text-stone-800 hover:text-emerald-700 hover:underline"
                  >
                    {row.className} <ArrowUpRight className="h-3 w-3" />
                    <span className="mt-0.5 block text-[11px] font-normal text-stone-400">
                      {row.count} kontribusi
                    </span>
                  </Link>
                  <span className="shrink-0 font-bold text-emerald-900">
                    {formatRupiah(row.total)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 bg-amber-50/50 px-5 py-3">
                <span className="text-xs font-semibold text-amber-900">
                  Umum / tidak terikat kelas
                  <span className="mt-0.5 block text-[11px] font-normal text-amber-800/70">
                    {stats.umumCount} kontribusi
                  </span>
                </span>
                <span className="shrink-0 font-bold text-amber-900">
                  {formatRupiah(stats.umumTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-emerald-50/70 px-5 py-3">
                <span className="text-xs font-extrabold text-emerald-950">
                  Total kuttab
                  <span className="mt-0.5 block text-[11px] font-semibold text-emerald-900/70">
                    {stats.donorCount} keluarga
                  </span>
                </span>
                <span className="shrink-0 font-extrabold text-emerald-950">
                  {formatRupiah(stats.total)}
                </span>
              </div>
            </div>

            <div className="hidden overflow-x-auto print:block sm:block">
              <table aria-label="Rekap per kelas" className="w-full min-w-[520px] text-sm tabular-nums">
              <thead>
                <tr className="border-b border-stone-200 bg-white text-left text-[11px] uppercase tracking-wide text-stone-500">
                  <th scope="col" className="px-5 py-3 font-semibold">Kelas</th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold">Kontribusi</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Total Ta&apos;awun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stats.perClass.map((row) => (
                  <tr key={row.classId} className="bg-white/70 hover:bg-stone-50/60">
                    <td className="px-5 py-3.5 font-semibold text-stone-800">
                      <Link
                        href={`/verifikasi?kelas=${row.classId}`}
                        className="inline-flex items-center gap-1 hover:text-emerald-700 hover:underline"
                      >
                        {row.className} <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-center text-stone-500">{row.count}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-900">
                      {formatRupiah(row.total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-amber-50/50">
                  <td className="px-5 py-3.5 font-semibold text-amber-900">
                    Umum / tidak terikat kelas
                  </td>
                  <td className="px-5 py-3.5 text-center text-amber-800/70">
                    {stats.umumCount}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-amber-900">
                    {formatRupiah(stats.umumTotal)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/70">
                  <td className="px-5 py-3.5 font-extrabold text-emerald-950">
                    Total kuttab
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-emerald-900">
                    {stats.donorCount}
                  </td>
                  <td className="px-5 py-3.5 text-right font-extrabold text-emerald-950">
                    {formatRupiah(stats.total)}
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </>
        </Card>
      )}

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-stone-900">
                {data.selectedClassName ?? "Belum ada kelas"}
              </p>
              <p className="text-xs text-stone-500">
                Rincian pembayaran • {data.classCount} baris, termasuk menunggu verifikasi
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 no-print">
            <Badge tone="green" className="text-[10px]">
              <BadgeCheck className="h-3 w-3" /> {verifiedCount} terverifikasi
            </Badge>
            <Badge tone="amber" className="text-[10px]">
              <Clock className="h-3 w-3" /> {waitingCount} menunggu
            </Badge>
          </div>
        </div>

        {data.rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Receipt className="mx-auto h-8 w-8 text-stone-300" />
            <p className="mt-2 text-sm font-semibold text-stone-600">
              Belum ada pembayaran dengan bukti transfer untuk kelas ini.
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Pembayaran akan muncul otomatis setelah bukti diunggah.
            </p>
          </div>
        ) : (
          <>
            <div className="no-print divide-y divide-stone-100 sm:hidden">
              {data.rows.map((row) => (
                <div key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-800">
                        {maskName(row.childName)}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-stone-400">
                        {maskPhone(row.phone)}
                      </p>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div className="text-[11px] leading-relaxed text-stone-400">
                      <p>{formatDateTime(row.proofUploadedAt)}</p>
                      <p>
                        Kode unik{" "}
                        <span className="font-bold text-amber-700">
                          {row.uniqueCode}
                        </span>
                      </p>
                    </div>
                    <p className="text-base font-extrabold tabular-nums text-emerald-900">
                      {formatRupiah(row.amount)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 bg-stone-50 px-4 py-3">
                <span className="text-[11px] font-semibold text-stone-500">
                  Total pokok kelas ini
                </span>
                <span className="font-extrabold tabular-nums text-emerald-900">
                  {formatRupiah(data.classTotal)}
                </span>
              </div>
            </div>

            <div className="hidden overflow-x-auto print:block sm:block">
              <table
                aria-label="Rincian pembayaran per kelas"
                className="w-full min-w-[720px] text-sm tabular-nums"
              >
                <thead>
                  <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-stone-500">
                    <th scope="col" className="w-12 px-4 py-3 text-center font-semibold">No</th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Nama anak <span className="normal-case tracking-normal text-stone-400">(tersamarkan)</span>
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">WhatsApp</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Waktu unggah bukti</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 text-center font-semibold">Kode unik</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Nominal pokok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.rows.map((row, index) => (
                    <tr key={row.id} className="bg-white hover:bg-stone-50/60">
                      <td className="px-4 py-3 text-center text-xs text-stone-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-stone-800">
                        {maskName(row.childName)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">
                        {maskPhone(row.phone)}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {formatDateTime(row.proofUploadedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-amber-700">
                        {row.uniqueCode}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-900">
                        {formatRupiah(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-stone-200 bg-stone-50/80">
                    <td colSpan={6} className="px-4 py-3 text-right text-xs font-semibold text-stone-500">
                      Total pokok kelas ini (termasuk menunggu verifikasi)
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-900">
                      {formatRupiah(data.classTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </Card>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-900">
          <p className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="h-3.5 w-3.5" /> Muncul setelah bukti diunggah
          </p>
          <p className="mt-1 text-emerald-900/75">
            Baris tampil otomatis setelah wali mengunggah bukti transfer. Admin
            tetap memeriksa secara manual; status “Terverifikasi” atau “Menunggu
            verifikasi” ditampilkan pada tiap baris. Nama disamarkan menjadi
            inisial, nomor WhatsApp hanya empat digit terakhir.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 text-xs leading-relaxed text-stone-600">
          <p className="flex items-center gap-1.5 font-bold text-stone-800">
            <Info className="h-3.5 w-3.5" /> Butuh bantuan?
          </p>
          <p className="mt-1">
            Jika pembayaran Anda belum muncul, hubungi admin dengan menyertakan
            nomor invoice dan bukti transfer.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {settings.contact_whatsapp && (
              <a
                href={waLink(
                  settings.contact_whatsapp,
                  "Assalamu'alaikum, saya ingin bertanya tentang rekap Ta'awun.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("secondary", "sm")}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Hubungi admin via WhatsApp
              </a>
            )}
            <Link
              href="/"
              className={buttonClasses("ghost", "sm", "px-0 text-emerald-700")}
            >
              Kembali ke halaman utama
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
