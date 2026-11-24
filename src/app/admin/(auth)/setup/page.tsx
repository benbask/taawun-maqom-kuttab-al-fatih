import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminSetupForm } from "@/components/admin/setup-form";
import { Card } from "@/components/ui/card";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buat Akun Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSetupPage() {
  const count = await getStore().getAdminCount().catch(() => 0);
  if (count > 0) redirect("/admin/login");

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 space-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900">
          <ShieldCheck className="h-3.5 w-3.5" /> Penyiapan pertama
        </span>
        <h1 className="text-xl font-extrabold tracking-tight text-emerald-950">
          Buat akun admin
        </h1>
        <p className="text-sm leading-relaxed text-stone-500">
          Akun ini hanya dapat dibuat sekali. Setelah dibuat, halaman ini tidak
          bisa dipakai lagi.
        </p>
      </div>
      <AdminSetupForm />
    </Card>
  );
}
