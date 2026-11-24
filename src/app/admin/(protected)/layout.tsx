import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AdminNav } from "@/components/admin/nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { Logo } from "@/components/site/logo";
import { safeSettings } from "@/lib/safe";
import { requireAdminPage } from "@/lib/session";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();
  const settings = await safeSettings();

  return (
    <div className="min-h-screen bg-[#f3f0e9]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-emerald-950 px-4 py-5 lg:flex">
        <Link href="/admin" className="mb-6 block px-1">
          <Logo siteName={settings.site_name} light />
        </Link>
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <AdminNav />
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/40">
            Masuk sebagai
          </p>
          <p className="mt-1 truncate text-sm font-bold text-white">{session.username}</p>
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
              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 sm:inline-flex">
                Admin aktif
              </span>
              <div className="lg:hidden">
                <LogoutButton />
              </div>
            </div>
          </div>
          <div className="border-t border-stone-200/70 px-4 py-2 lg:hidden">
            <AdminNav variant="mobile" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
