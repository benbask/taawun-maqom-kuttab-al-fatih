import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { buttonClasses } from "@/components/ui/button";
import { safeSettings } from "@/lib/safe";
import { requireAdminPage } from "@/lib/session";
import { getStore } from "@/lib/store";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();
  const settings = await safeSettings();
  const dbAdmin = await getStore().getAdminById(session.adminId).catch(() => null);
  const slot = dbAdmin?.slot ?? session.slot ?? null;
  const permissions = dbAdmin?.permissions ?? session.permissions ?? null;

  return (
    <div className="min-h-screen bg-[#f3f0e9]">
      <AdminSidebar
        siteName={settings.site_name}
        username={session.username}
        slot={slot}
        permissions={permissions}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f3f0e9]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 pl-14 pr-4 sm:pl-16 sm:pr-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                Panel administrasi
              </p>
              <p className="truncate text-sm font-bold text-stone-800">
                {settings.site_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                aria-label="Buka situs publik"
                title="Buka situs publik"
                className={buttonClasses(
                  "ghost",
                  "sm",
                  "w-9 px-0 text-stone-500 sm:w-auto sm:px-3",
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Situs publik</span>
              </Link>
              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 sm:inline-flex">
                Admin aktif
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
