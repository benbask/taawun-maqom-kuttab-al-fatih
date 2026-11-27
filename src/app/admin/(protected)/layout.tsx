import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AdminNav } from "@/components/admin/nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { Logo } from "@/components/site/logo";
import { SLOT_LABELS } from "@/lib/admin-permissions";
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-emerald-950 px-4 py-5 lg:flex">
        <Link href="/admin" className="mb-6 block px-1">
          <Logo siteName={settings.site_name} light />
        </Link>
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <AdminNav permissions={permissions} />
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/40">
            Masuk sebagai
          </p>
          <p className="mt-1 truncate text-sm font-bold text-white">{session.username}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-emerald-200/60">
            {SLOT_LABELS[slot ?? ""] ?? "Admin"}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200/80 hover:text-amber-100"
            >
              Situs publik <ArrowUpRight className="h-3 w-3" />
            </Link>
            <LogoutButton compact />
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f3f0e9]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <Link href="/admin">
                <Logo siteName={settings.site_name} compact />
              </Link>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                Panel administrasi
              </p>
              <p className="text-sm font-bold text-stone-800">{settings.site_name}</p>
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
              <span className="sm:hidden">
                <LogoutButton iconOnly />
              </span>
              <span className="hidden sm:inline-flex">
                <LogoutButton />
              </span>
            </div>
          </div>
          <div className="border-t border-stone-200/70 px-4 py-2 lg:hidden">
            <AdminNav variant="mobile" permissions={permissions} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
