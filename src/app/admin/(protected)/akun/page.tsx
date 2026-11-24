import type { Metadata } from "next";
import { ShieldCheck, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { PasswordForm } from "@/components/admin/password-form";
import { formatDateTime } from "@/lib/format";
import { getAdminSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Akun Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAccountPage() {
  const session = await getAdminSession();
  const admin = session ? await getStore().getAdminById(session.adminId) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Pengaturan"
        title="Akun admin"
        description="Kelola kredensial dan lihat informasi akun Anda."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-3 p-4">
          <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-100">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-stone-500">Username</p>
            <p className="text-lg font-extrabold text-stone-900">
              {session?.username ?? "-"}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="rounded-xl bg-sky-50 p-2.5 text-sky-700 ring-1 ring-sky-100">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-stone-500">Masuk terakhir</p>
            <p className="text-sm font-bold text-stone-900">
              {formatDateTime(admin?.last_login_at ?? null)}
            </p>
          </div>
        </Card>
      </div>

      <PasswordForm />
    </div>
  );
}
