import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/login-form";
import { Card } from "@/components/ui/card";
import { isDemoMode } from "@/lib/env";
import { getAdminSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Masuk Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const store = getStore();
  const count = await store.getAdminCount().catch(() => 0);
  if (count === 0) redirect("/admin/setup");

  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 space-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" /> Area terbatas
        </span>
        <h1 className="text-xl font-extrabold tracking-tight text-emerald-950">
          Masuk panel admin
        </h1>
        <p className="text-sm text-stone-500">
          Kelola konten Ta&apos;awun, verifikasi pembayaran, dan pengaturan QRIS.
        </p>
      </div>
      <AdminLoginForm demo={isDemoMode} />
    </Card>
  );
}
