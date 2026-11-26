import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Clock,
  GraduationCap,
  Info,
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
import { formatDateTime, formatRupiah, maskName, maskPhone } from "@/lib/format";
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
              <Wallet className="h-3.5 w-3.5" />
            </span>
            Total terkumpul
          </div>
          <p className="mt-2 text-xl font-extrabold text-emerald-950">
            {formatRupiah(stats.total)}
          </p>
          <p className="text-[11px] text-stone-400">Termasuk menunggu verifikasi</p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
              <Target className="h-3.5 w-3.5" />
            </span>
            Target Ta&apos;awun
          </div>
          <p className="mt-2 text-xl font-extrabold text-emerald-950">
            {formatRupiah(stats.target)}
          </p>
          <p className="text-[11px] text-stone-400">{percent}% tercapai</p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="rounded-lg bg-sky-100 p-1.5 text-sky-700">
              <Users className="h-3.5 w-3.5" />
            </span>
            Kontribusi
          </div>
          <p className="mt-2 text-xl font-extrabold text-emerald-950">
            {stats.donorCount} keluarga
          </p>
          <p className="text-[11px] text-stone-400">Ayah / donatur umum</p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="rounded-lg bg-violet-100 p-1.5 text-violet-700">
              <GraduationCap className="h-3.5 w-3.5" />
            </span>
            Data anak
          </div>
          <p className="mt-2 text-xl font-extrabold text-emerald-950">
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
            <h2 className="text-sm font-bold text-stone-900">Rekap per kelas</h2>
            <p className="text-xs text-stone-500">
              Klik kelas untuk melihat rincian pembayaran.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-white text-left text-[11px] uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3 font-semibold">Kelas</th>
                  <th className="px-5 py-3 text-center font-semibold">Kontribusi</th>
                  <th className="px-5 py-3 text-right font-semibold">Total Ta&apos;awun</th>
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
                Total {data.classCount} baris, termasuk yang menunggu verifikasi
              </p>
            </div>
          </div>
          <Badge tone="amber">
            <Clock className="h-3.5 w-3.5" /> Status per baris
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-stone-500">
                <th className="w-14 px-4 py-3 text-center font-semibold">No</th>
                <th className="px-4 py-3 font-semibold">Nama santri</th>
                <th className="px-4 py-3 font-semibold">WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Waktu unggah bukti</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Kode unik</th>
                <th className="px-4 py-3 text-right font-semibold">Nominal pokok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.rows.map((row, index) => (
                <tr key={row.id} className="bg-white">
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
                    {row.status === "verified" ? (
                      <Badge tone="green" className="text-[10px]">
                        <BadgeCheck className="h-3 w-3" /> Terverifikasi
                      </Badge>
                    ) : (
                      <Badge tone="amber" className="text-[10px]">
                        <Clock className="h-3 w-3" /> Menunggu verifikasi
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs font-bold text-amber-700">
                    {row.uniqueCode}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-900">
                    {formatRupiah(row.amount)}
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-stone-500">
                    Belum ada pembayaran dengan bukti transfer untuk kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
            {data.rows.length > 0 && (
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
            )}
          </table>
        </div>
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
          <Link
            href="/"
            className={buttonClasses("ghost", "sm", "mt-2 h-8 px-0 text-emerald-700")}
          >
            Kembali ke halaman utama
          </Link>
        </div>
      </div>
    </div>
  );
}
