import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  HandHeart,
  Heart,
  Lock,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  UserRoundPlus,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/site/progress-bar";
import { TopContributorsCard } from "@/components/site/top-contributors";
import { ShareProgressButton } from "@/components/public/share-progress-button";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/format";
import { isDemoMode } from "@/lib/env";
import { safePublicStats, safeSettings } from "@/lib/safe";
import { shareCardVersion } from "@/lib/share-card";
import { getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await safeSettings();
  const stats = await safePublicStats(settings.target_amount);
  const siteName = settings.site_name?.trim() || "Ta'awun Maqom Kuttab Al Fatih Lampung";
  const title = settings.share_title?.trim() || siteName;
  const description =
    settings.share_description?.trim() ||
    settings.tagline?.trim() ||
    "Ikut berTa'awun untuk pendidikan Qur'an di Maqom Kuttab Al Fatih Lampung. Transparan, terverifikasi, dan mudah melalui QRIS.";
  const image = `/api/share-card?v=${shareCardVersion(stats)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName,
      type: "website",
      locale: "id_ID",
      images: [
        { url: image, width: 1200, height: 630, alt: "Kartu perolehan Ta'awun" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

const steps = [
  {
    icon: MessageCircle,
    title: "Masukkan nomor WhatsApp",
    body: "Gunakan nomor WhatsApp aktif dan Kode Keamanan dari pengumuman Maqom di grup angkatan.",
  },
  {
    icon: GraduationCap,
    title: "Daftarkan ayah & data anak",
    body: "Pilih peran, kelas, dan nama anak. Nama anak dipakai untuk rekap per kelas.",
  },
  {
    icon: QrCode,
    title: "Bayar dengan QRIS",
    body: "QRIS dinamis dibuat otomatis sesuai nominal. Scan dari aplikasi bank atau e-wallet apa pun.",
  },
  {
    icon: BadgeCheck,
    title: "Unggah bukti",
    body: "Unggah bukti transfer. Admin memverifikasi, lalu pembayaran tampil di halaman rekap publik.",
  },
];

export default async function HomePage() {
  const settings = await safeSettings();
  const stats = await safePublicStats(settings.target_amount);
  const session = await getUserSession();
  const classes = await getStore()
    .listClasses(true)
    .catch(() => []);
  const remaining = Math.max(0, settings.target_amount - stats.total);
  const percent =
    settings.target_amount > 0
      ? Math.round((stats.total / settings.target_amount) * 100)
      : 0;

  const classRows = classes.map((cls) => {
    const row = stats.perClass.find((item) => item.classId === cls.id);
    return {
      id: cls.id,
      name: cls.name,
      total: row?.total ?? 0,
      count: row?.count ?? 0,
      zeroCount: row?.zeroCount ?? 0,
    };
  });

  return (
    <div>
      {isDemoMode && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          Mode demo aktif — memakai data contoh lokal. Kata sandi admin demo:{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5">admin / Taawun123!</code>
        </div>
      )}

      <section className="hero-glow relative overflow-hidden border-b border-emerald-950/10">
        <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold" className="gap-1.5 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" /> Ta&apos;awun 2026
              </Badge>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800/70">
                Maqom Kuttab Al Fatih Lampung
              </span>
            </div>

            <div className="space-y-4">
              <p className="font-arabic text-2xl leading-relaxed text-emerald-800/85 sm:text-3xl">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <h1 className="max-w-2xl text-3xl font-extrabold leading-[1.15] tracking-tight text-emerald-950 sm:text-4xl lg:text-[3.1rem]">
                {settings.hero_title}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
                {settings.hero_subtitle}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row">
                {session ? (
                  <>
                    <Link
                      href="/tambah"
                      className={buttonClasses("primary", "lg")}
                    >
                      Tambah Ta&apos;awun <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/akun"
                      className={buttonClasses("outline", "lg")}
                    >
                      <Wallet className="h-4 w-4" /> Lihat akun
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/daftar"
                      className={buttonClasses("primary", "lg")}
                    >
                      Daftar Maqom &amp; Ta&apos;awun{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/tambah"
                      className={buttonClasses("outline", "lg")}
                    >
                      <HandHeart className="h-4 w-4" /> Tambah Ta&apos;awun
                    </Link>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed text-stone-500">
                {session ? (
                  <>
                    Data anak dan invoice Anda tersimpan di{" "}
                    <span className="font-semibold text-emerald-800">
                      akun
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Sudah pernah daftar? Gunakan{" "}
                    <span className="font-semibold text-emerald-800">
                      Tambah Ta&apos;awun
                    </span>{" "}
                    — data lama otomatis terisi.
                  </>
                )}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/70">
                ± 2 menit • Tanpa OTP • QRIS otomatis
              </p>
            </div>

            <div className="grid gap-2.5 text-sm text-stone-600 sm:grid-cols-3">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700" /> Terverifikasi admin
              </span>
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-emerald-700" /> QRIS dinamis
              </span>
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-700" /> Kode Keamanan
              </span>
            </div>
          </div>

          <Card className="relative overflow-hidden border-emerald-900/10 bg-white/90 p-6 shadow-[0_30px_80px_-40px_rgba(6,78,59,0.45)] backdrop-blur sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-700 via-emerald-500 to-amber-400" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
                  Total Ta&apos;awun terkumpul
                </p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-4xl">
                  {formatRupiah(stats.total)}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  dari target {formatRupiah(settings.target_amount)}
                </p>
                <p className="mt-1 text-[11px] text-stone-400">
                  Termasuk bukti yang menunggu verifikasi dan kode unik audit.
                </p>
              </div>
              <span className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-100">
                <Wallet className="h-5 w-5" />
              </span>
            </div>

            <ProgressBar
              value={stats.total}
              max={settings.target_amount}
              className="mt-6"
            />

            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-stone-50 p-3">
                <Users className="mx-auto h-4 w-4 text-emerald-700" />
                <p className="mt-1.5 text-lg font-bold text-stone-900">{stats.donorCount}</p>
                <p className="text-[11px] text-stone-500">Donatur</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3">
                <Target className="mx-auto h-4 w-4 text-emerald-700" />
                <p className="mt-1.5 truncate text-lg font-bold text-stone-900">
                  {settings.deadline ? formatDate(settings.deadline) : "—"}
                </p>
                <p className="text-[11px] text-stone-500">Batas</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-900">
                  Partisipasi OTS
                </p>
                <p className="text-[11px] text-emerald-800">
                  {stats.ots.terdaftar} dari {stats.ots.total} keluarga OTS terdaftar
                </p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  {
                    label: "Ikut Maqom",
                    value: stats.ots.hadir,
                    icon: UserCheck,
                  },
                  {
                    label: "Tidak ikut",
                    value: stats.ots.tidak,
                    icon: UserX,
                  },
                  {
                    label: "Belum mendaftar",
                    value: stats.ots.belumDaftar,
                    icon: UserRoundPlus,
                  },
                  {
                    label: "Bertaawun",
                    value: stats.ots.bertaawun,
                    icon: HandHeart,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg bg-white/80 p-2 text-center ring-1 ring-emerald-100"
                  >
                    <item.icon className="mx-auto h-3.5 w-3.5 text-emerald-700" />
                    <p className="mt-1 text-base font-extrabold text-emerald-950">
                      {item.value}
                    </p>
                    <p className="text-[10px] leading-tight text-stone-500">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <ShareProgressButton
              total={stats.total}
              percent={percent}
              ots={stats.ots}
            />

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-stone-100 pt-4 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {stats.lastUpdated
                  ? `Diperbarui ${formatDateTime(stats.lastUpdated)}`
                  : "Belum ada pembayaran dengan bukti transfer"}
              </span>
              <Link
                href="/verifikasi"
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Verifikasi <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6" id="kebutuhan">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <Card className="p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
                <Heart className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-emerald-950">
                  Kebutuhan Ta&apos;awun
                </h2>
                <p className="text-xs text-stone-500">
                  Informasi ini dikelola langsung oleh admin Maqom Kuttab.
                </p>
              </div>
            </div>
            <div className="prose-taawun max-w-none text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {settings.info_markdown ||
                  "Informasi kebutuhan Ta'awun belum diisi oleh admin."}
              </ReactMarkdown>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="bg-emerald-950 p-5 text-emerald-50">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300/80">
                  Ringkasan
                </p>
                <p className="mt-2 text-2xl font-extrabold">{formatRupiah(stats.total)}</p>
                <p className="text-xs text-emerald-100/60">
                  terkumpul, termasuk menunggu verifikasi
                </p>
              </div>
              <div className="divide-y divide-stone-100">
                <Row label="Target Ta'awun" value={formatRupiah(settings.target_amount)} />
                <Row label="Kekurangan" value={formatRupiah(remaining)} strong />
                <Row
                  label="Batas waktu"
                  value={settings.deadline ? formatDate(settings.deadline) : "Tidak ditentukan"}
                />
                <Row
                  label="Donatur"
                  value={`${stats.donorCount} keluarga`}
                />
              </div>
              <div className="p-5 pt-4">
                <Link
                  href={session ? "/tambah" : "/daftar"}
                  className={buttonClasses("primary", "md", "w-full")}
                >
                  {session ? "Tambah Ta'awun" : "Daftar Maqom & Ta'awun"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900">
              <p className="flex items-center gap-1.5 font-bold">
                <CalendarDays className="h-3.5 w-3.5" /> Catatan transparansi
              </p>
              <p className="mt-1.5 text-amber-900/80">
                Rekap publik menampilkan pembayaran yang bukti transfernya sudah
                diunggah, termasuk yang masih menunggu verifikasi admin. Total
                terkumpul memakai nominal transfer penuh (Ta&apos;awun pokok +
                kode unik audit). Rekap per kelas memakai nominal pokok.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-emerald-950/10 bg-white/60" id="rekap">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Rekap transparan
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
                Total Ta&apos;awun per kelas
              </h2>
              <p className="mt-1 max-w-xl text-sm text-stone-500">
                Satu kuttab, banyak kelas. Rincian berasal dari pembayaran yang
                bukti transfernya sudah diunggah, termasuk yang menunggu
                verifikasi.
              </p>
            </div>
            <Link
              href="/verifikasi"
              target="_blank"
              className={buttonClasses("outline", "sm")}
            >
              Buka verifikasi publik <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={Wallet}
              label="Total kuttab"
              value={formatRupiah(stats.total)}
              note="Termasuk kode unik audit"
            />
            <SummaryCard
              icon={GraduationCap}
              label="Per kelas"
              value={formatRupiah(
                stats.perClass.reduce((total, row) => total + row.total, 0),
              )}
              note={`${stats.perClass.length} kelas, nominal pokok`}
            />
            <SummaryCard
              icon={HandHeart}
              label="Ta'awun umum"
              value={formatRupiah(stats.umumTotal)}
              note={`${stats.umumCount} kontribusi umum`}
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <TopContributorsCard contributors={stats.topContributors} />
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-left text-xs uppercase tracking-wide text-stone-500">
                    <th className="px-5 py-3 font-semibold">Kelas</th>
                    <th className="px-5 py-3 text-center font-semibold">Kontribusi</th>
                    <th className="px-5 py-3 text-right font-semibold">Total Ta&apos;awun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {classRows.map((row) => (
                    <tr key={row.id} className="bg-white/70">
                      <td className="px-5 py-3.5 font-semibold text-stone-800">
                        <Link
                          href={`/verifikasi?kelas=${row.id}`}
                          className="inline-flex items-center gap-1 hover:text-emerald-700 hover:underline"
                        >
                          {row.name} <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        {row.zeroCount > 0 && (
                          <span className="mt-1 block text-[10px] font-normal text-stone-400">
                            +{row.zeroCount} kontribusi tanpa nominal (kelas kakak)
                          </span>
                        )}
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
                </tbody>
                <tfoot>
                  <tr className="border-t border-stone-200 bg-stone-50/70">
                    <td className="px-5 py-3 font-semibold text-stone-500" colSpan={2}>
                      Kode unik audit
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-amber-700">
                      {formatRupiah(stats.uniqueCodeTotal)}
                    </td>
                  </tr>
                  <tr className="border-t border-emerald-900/10 bg-emerald-950 text-emerald-50">
                    <td className="px-5 py-4 font-bold" colSpan={2}>
                      Total Maqom Kuttab Al Fatih Lampung
                    </td>
                    <td className="px-5 py-4 text-right text-base font-extrabold text-amber-200">
                      {formatRupiah(stats.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            </Card>
          </div>

          {classRows.length === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-stone-300 bg-white/60 p-4 text-center text-sm text-stone-500">
              Admin belum menambahkan kelas. Silakan hubungi admin Ta&apos;awun.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Alur mudah
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
            Empat langkah menunaikan Ta&apos;awun
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={step.title} className="relative p-5">
              <span className="absolute right-4 top-4 text-3xl font-black text-emerald-900/10">
                0{index + 1}
              </span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-stone-900">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="islamic-pattern relative overflow-hidden rounded-3xl bg-emerald-950 px-6 py-12 text-center shadow-[0_40px_100px_-50px_rgba(6,78,59,0.9)] sm:px-12">
          <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl space-y-4">
            <Badge tone="gold" className="border-amber-400/30 bg-amber-400/15 text-amber-200">
              <Heart className="h-3.5 w-3.5" /> Setiap kontribusi berarti
            </Badge>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Mari menjadi bagian dari perjalanan Qur&apos;ani mereka
            </h2>
            <p className="text-sm leading-relaxed text-emerald-100/70">
              Ta&apos;awun Anda membantu operasional pendidikan, kebutuhan santri,
              dan pengembangan sarana Maqom Kuttab Al Fatih Lampung.
            </p>
            <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
              <Link
                href={session ? "/tambah" : "/daftar"}
                className={buttonClasses("gold", "lg")}
              >
                {session ? "Tambah Ta'awun" : "Daftar Maqom & Ta'awun"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/verifikasi"
                target="_blank"
                className={buttonClasses(
                  "outline",
                  "lg",
                  "border-white/25 bg-white/5 text-white hover:bg-white/10",
                )}
              >
                Lihat verifikasi <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={strong ? "font-bold text-emerald-800" : "font-semibold text-stone-800"}>
        {value}
      </span>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="flex items-start gap-3 p-4">
      <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-stone-500">{label}</p>
        <p className="truncate text-lg font-extrabold text-stone-900">{value}</p>
        <p className="text-[11px] text-stone-400">{note}</p>
      </div>
    </Card>
  );
}
