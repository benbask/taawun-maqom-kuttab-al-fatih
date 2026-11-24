import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock, Info, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrintButton } from "@/components/site/print-button";
import { formatDateTime, formatRupiah, maskName, maskPhone } from "@/lib/format";
import { safeSettings } from "@/lib/safe";
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

  let data;
  try {
    data = await getStore().getVerificationData(selected);
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
            Verifikasi Ta&apos;awun
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500">
            Daftar pembayaran yang bukti transfernya sudah diunggah, disusun per
            kelas. Status verifikasi admin ditampilkan pada setiap baris. Nama
            santri dan nomor WhatsApp ditampilkan dalam bentuk tersamarkan untuk
            menjaga privasi.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-900/10 bg-emerald-950 px-5 py-4 text-emerald-50 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300/80">
            {data.selectedClassName ?? "Pilih kelas"}
          </p>
          <p className="mt-1 text-2xl font-extrabold">{formatRupiah(data.classTotal)}</p>
          <p className="text-xs text-emerald-100/60">
            {data.classCount} pembayaran tercatat
          </p>
        </div>
      </div>

      {data.classes.length > 0 ? (
        <div className="no-print mt-7 flex flex-wrap gap-2">
          {data.classes.map((cls) => {
            const active = cls.id === data.selectedClassId;
            return (
              <Link
                key={cls.id}
                href={`/verifikasi?kelas=${cls.id}`}
                className={
                  active
                    ? "rounded-full bg-emerald-900 px-4 py-2 text-xs font-bold text-white shadow-sm"
                    : "rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 transition hover:border-emerald-300 hover:text-emerald-800"
                }
              >
                {cls.name}
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="mt-7 p-6 text-center text-sm text-stone-500">
          Belum ada kelas yang aktif. Hubungi admin Ta&apos;awun.
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
                <th className="px-4 py-3 text-right font-semibold">Nominal</th>
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
                  <td className="px-4 py-3 text-right font-bold text-emerald-900">
                    {formatRupiah(row.amount)}
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-500">
                    Belum ada pembayaran dengan bukti transfer untuk kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
            {data.rows.length > 0 && (
              <tfoot>
                <tr className="border-t border-stone-200 bg-stone-50/80">
                  <td colSpan={5} className="px-4 py-3 text-right text-xs font-semibold text-stone-500">
                    Total kelas ini (termasuk menunggu verifikasi)
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
