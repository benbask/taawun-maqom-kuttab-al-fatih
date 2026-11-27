import type { Metadata } from "next";
import { ShieldCheck, UserRound } from "lucide-react";
import { AdminAccountsPanel } from "@/components/admin/admin-accounts-panel";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { PasswordForm } from "@/components/admin/password-form";
import { PERMISSION_LABELS, SLOT_LABELS } from "@/lib/admin-permissions";
import { formatDateTime } from "@/lib/format";
import { getAdminSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Akun Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAccountPage() {
  const session = await getAdminSession();
  const store = getStore();
  const admin = session ? await store.getAdminById(session.adminId) : null;
  const canManage = admin?.slot === "super_admin";
  const admins = canManage ? await store.listAdmins() : [];
  const ownPermissions = admin?.permissions ?? session?.permissions ?? null;
  const ownSlot = admin?.slot ?? session?.slot ?? null;

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
            <p className="mt-1 text-[11px] text-stone-500">
              Masuk terakhir: {formatDateTime(admin?.last_login_at ?? null)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="rounded-xl bg-sky-50 p-2.5 text-sky-700 ring-1 ring-sky-100">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-stone-500">Level akses Anda</p>
            <p className="text-sm font-bold text-stone-900">
              {SLOT_LABELS[ownSlot ?? ""] ?? "Admin"}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
              {ownPermissions === null
                ? "Akses penuh (super admin)"
                : ownPermissions.length
                  ? ownPermissions
                      .map((item) =>
                        PERMISSION_LABELS[item as keyof typeof PERMISSION_LABELS] ?? item,
                      )
                      .join(" · ")
                  : "Tidak ada menu yang dapat diakses."}
            </p>
          </div>
        </Card>
      </div>

      <PasswordForm />

      {canManage && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-extrabold text-stone-900">
            Kredensial & hak akses admin
          </h2>
          <AdminAccountsPanel admins={admins} />
        </section>
      )}
    </div>
  );
}
