import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GraduationCap, MessageCircle, Receipt, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { roleLabels } from "@/lib/account-roles";
import {
  formatDateTime,
  formatPhone,
  formatRupiah,
  invoiceStatusLabel,
  invoiceStatusTone,
  waLink,
} from "@/lib/format";
import { getStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profil OTS",
  robots: { index: false, follow: false },
};

export default async function AdminOtsProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getStore();
  const family = await store.getFamilyById(id).catch(() => null);

  if (!family) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Card className="p-8">
          <UserRound className="mx-auto h-8 w-8 text-stone-400" />
          <h1 className="mt-3 text-lg font-bold text-stone-800">Data tidak ditemukan</h1>
          <Link href="/admin/kehadiran" className={buttonClasses("primary", "sm", "mt-4")}>
            Kembali ke daftar hadir
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
  const linkedPhones = Array.isArray(
    (family.custom_data as { linked_phones?: unknown })?.linked_phones,
  )
    ? ((family.custom_data as { linked_phones: string[] }).linked_phones)
    : [];

  return (
    <div>
      <PageHeader
        eyebrow="Profil OTS"
        title={family.parent_name}
        description={`Bergabung ${formatDateTime(family.created_at)}`}
        actions={
          <Link href="/admin/kehadiran" className={buttonClasses("outline", "sm")}>
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali
          </Link>
        }
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-stone-900">Data keluarga</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                  Nama
                </p>
                <p className="font-semibold text-stone-800">{family.parent_name}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                  WhatsApp
                </p>
                <a
                  href={waLink(family.phone, `Assalamu'alaikum ${family.parent_name}, ...`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  <MessageCircle className="h-4 w-4" /> {formatPhone(family.phone)}
                </a>
              </div>
              {linkedPhones.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                    Nomor tertaut
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {linkedPhones.map((phone) => (
                      <a
                        key={phone}
                        href={waLink(phone, `Assalamu'alaikum ${family.parent_name}, ...`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
                      >
                        <MessageCircle className="h-3 w-3" /> {formatPhone(phone)}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                  Peran
                </p>
                <Badge tone="green" className="mt-1">
                  {family.account_type ? roleLabels[family.account_type] : "Belum dipilih"}
                </Badge>
              </div>
              {family.alumni_profile?.angkatan && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                    Angkatan
                  </p>
                  <p className="font-semibold text-stone-800">
                    {family.alumni_profile.angkatan}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <GraduationCap className="h-4 w-4 text-emerald-700" /> Data santri
            </h2>
            <div className="mt-3 space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/70 px-3 py-2.5"
                >
                  <p className="text-sm font-semibold text-stone-800">{student.name}</p>
                  <p className="text-xs text-stone-500">
                    {classes.find((cls) => cls.id === student.class_id)?.name ?? "Umum"}
                  </p>
                </div>
              ))}
              {!students.length && (
                <p className="rounded-xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500">
                  Belum ada santri.
                </p>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
              <Receipt className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-stone-900">Invoice</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoice/${invoice.id}`}
                  target="_blank"
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-stone-50/60"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-emerald-800">
                      {invoice.invoice_no}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {formatDateTime(invoice.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        invoiceStatusTone(invoice.status),
                      )}
                    >
                      {invoiceStatusLabel(invoice.status)}
                    </span>
                    <span className="text-xs font-bold text-stone-800">
                      {formatRupiah(invoice.total_amount)}
                    </span>
                  </div>
                </Link>
              ))}
              {!invoices.length && (
                <p className="px-5 py-8 text-center text-xs text-stone-500">
                  Belum ada invoice.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
