import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { AutoVerifyQueueButton } from "@/components/admin/auto-verify-queue-button";
import { VerificationTable } from "@/components/admin/verification-table";
import { getStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verifikasi Pembayaran",
  robots: { index: false, follow: false },
};

const filters = [
  { value: "waiting_verification", label: "Menunggu verifikasi", icon: Clock },
  { value: "all", label: "Semua", icon: BadgeCheck },
  { value: "verified", label: "Terverifikasi", icon: BadgeCheck },
  { value: "pending", label: "Belum bayar", icon: Clock },
  { value: "rejected", label: "Ditolak", icon: BadgeCheck },
];

export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = filters.some((filter) => filter.value === raw)
    ? raw
    : "waiting_verification";
  const store = getStore();
  const all = await store.listAllInvoices({ includeDemo: true });
  const invoices = status === "all"
    ? all
    : all.filter((invoice) => invoice.status === status);
  const waitingCount = all.filter(
    (invoice) => invoice.status === "waiting_verification",
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Pembayaran"
        title="Verifikasi bukti transfer"
        description="Periksa nominal dan kode unik pada bukti, lalu setujui atau tolak pembayaran."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AutoVerifyQueueButton />
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
              {waitingCount} menunggu
            </span>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = status === filter.value;
          const count =
            filter.value === "all"
              ? all.length
              : all.filter((invoice) => invoice.status === filter.value).length;
          return (
            <Link
              key={filter.value}
              href={
                filter.value === "waiting_verification"
                  ? "/admin/verifikasi"
                  : `/admin/verifikasi?status=${filter.value}`
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                active
                  ? "border-emerald-900 bg-emerald-900 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:text-emerald-800",
              )}
            >
              <filter.icon className="h-3.5 w-3.5" />
              {filter.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  active ? "bg-white/15" : "bg-stone-100 text-stone-500",
                )}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <VerificationTable invoices={invoices} />
      </Card>
    </div>
  );
}
