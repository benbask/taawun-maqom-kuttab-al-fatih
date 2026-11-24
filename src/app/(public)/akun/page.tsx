import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  GraduationCap,
  HandHeart,
  Phone,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AccountRoleCard } from "@/components/public/account-role-card";
import { UserLogoutButton } from "@/components/public/user-logout-button";
import {
  formatDateTime,
  formatPhone,
  formatRupiah,
  invoiceStatusLabel,
  invoiceStatusTone,
} from "@/lib/format";
import { getStore } from "@/lib/store";
import { getUserSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Akun Saya",
  description: "Riwayat dan status Ta'awun Anda.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getUserSession();
  if (!session) redirect("/masuk?next=/akun");

  const store = getStore();
  const family = session.familyId
    ? await store.getFamilyById(session.familyId).catch(() => null)
    : await store.getFamilyByPhone(session.phone).catch(() => null);

  if (!family) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <Card className="p-8">
          <Users className="mx-auto h-10 w-10 text-emerald-700" />
          <h1 className="mt-3 text-xl font-extrabold text-emerald-950">
            Data keluarga belum terdaftar
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Nomor {formatPhone(session.phone)} sudah terverifikasi, tetapi belum
            terhubung dengan data santri.
          </p>
          <Link href="/daftar" className={buttonClasses("primary", "md", "mt-4")}>
            Daftarkan anak sekarang <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    );
  }

  const [students, classes, invoices] = await Promise.all([
    store.listStudents(family.id).catch(() => []),
    store.listClasses(false).catch(() => []),
    store.listInvoicesByFamily(family.id).catch(() => []),
  ]);

  const verified = invoices.filter((invoice) => invoice.status === "verified");
  const totalVerified = verified.reduce((total, invoice) => total + invoice.base_amount, 0);
  const waiting = invoices.filter((invoice) =>
    ["pending", "waiting_verification"].includes(invoice.status),
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
            Akun Ta&apos;awun
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
            Assalamu&apos;alaikum, {family.parent_name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
            <Phone className="h-3.5 w-3.5" /> {formatPhone(family.phone)}
            <span className="text-stone-300">•</span>
            <CalendarDays className="h-3.5 w-3.5" /> Bergabung{" "}
            {formatDateTime(family.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tambah" className={buttonClasses("primary", "sm")}>
            <HandHeart className="h-3.5 w-3.5" /> Tambah Ta&apos;awun
          </Link>
          <UserLogoutButton />
        </div>
      </div>

      <div className="mt-7">
        <AccountRoleCard
          role={family.account_type}
          hasAlumniProfile={Boolean(family.alumni_profile?.angkatan)}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-100">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-stone-500">Ta&apos;awun terverifikasi</p>
            <p className="text-xl font-extrabold text-emerald-950">
              {formatRupiah(totalVerified)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700 ring-1 ring-amber-100">
            <Receipt className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-stone-500">Menunggu proses</p>
            <p className="text-xl font-extrabold text-emerald-950">{waiting} invoice</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="rounded-xl bg-sky-50 p-2.5 text-sky-700 ring-1 ring-sky-100">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-stone-500">Santri terdaftar</p>
            <p className="text-xl font-extrabold text-emerald-950">{students.length} anak</p>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-stone-900">Data santri</h2>
          <p className="text-xs text-stone-500">
            Daftar anak yang terhubung dengan akun ini.
          </p>
          <div className="mt-4 space-y-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-stone-100 bg-stone-50/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-800">
                    {student.name}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {classes.find((cls) => cls.id === student.class_id)?.name ??
                      "Kelas belum diatur"}
                  </p>
                </div>
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              </div>
            ))}
            {students.length === 0 && (
              <p className="rounded-xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500">
                Belum ada santri.
              </p>
            )}
          </div>
          <Link
            href="/daftar"
            className={buttonClasses("outline", "sm", "mt-4 w-full")}
          >
            Daftarkan anak baru
          </Link>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Riwayat invoice</h2>
              <p className="text-xs text-stone-500">
                {invoices.length} invoice tercatat
              </p>
            </div>
            <Link href="/tambah" className={buttonClasses("secondary", "sm")}>
              Tambah
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-emerald-900">
                      {invoice.invoice_no}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-400">
                      {formatDateTime(invoice.created_at)} •{" "}
                      {invoice.type === "registration" ? "Pendaftaran" : "Tambahan"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                      invoiceStatusTone(invoice.status),
                    )}
                  >
                    {invoiceStatusLabel(invoice.status)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-stone-500">
                    {invoice.items
                      .map((item) => item.student?.name ?? item.description ?? "Ta'awun")
                      .join(", ")}
                  </p>
                  <p className="text-sm font-extrabold text-stone-900">
                    {formatRupiah(invoice.total_amount)}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-stone-400">
                    Pokok {formatRupiah(invoice.base_amount)} + kode{" "}
                    {invoice.unique_code}
                  </p>
                  <Link
                    href={`/invoice/${invoice.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    Buka invoice <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="px-5 py-10 text-center">
                <Receipt className="mx-auto h-8 w-8 text-stone-300" />
                <p className="mt-2 text-sm font-semibold text-stone-600">
                  Belum ada invoice
                </p>
                <p className="text-xs text-stone-500">
                  Mulai Ta&apos;awun pertama Anda sekarang.
                </p>
                <Link href="/daftar" className={buttonClasses("primary", "sm", "mt-3")}>
                  Daftar Ta&apos;awun
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
