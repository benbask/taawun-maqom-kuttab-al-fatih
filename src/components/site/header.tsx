import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { UserLogoutButton } from "@/components/public/user-logout-button";
import { buttonClasses } from "@/components/ui/button";
import { waLink } from "@/lib/format";

const baseLinks = [
  { href: "/#kebutuhan", label: "Kebutuhan" },
  { href: "/#rekap", label: "Rekap" },
  { href: "/verifikasi", label: "Verifikasi", newTab: true },
];

export function SiteHeader({
  siteName,
  contactWhatsApp,
  signedIn = false,
}: {
  siteName: string;
  contactWhatsApp: string;
  signedIn?: boolean;
}) {
  const links = [
    ...baseLinks,
    signedIn
      ? { href: "/akun", label: "Akun", newTab: false }
      : { href: "/masuk", label: "Masuk", newTab: false },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-[#f8f5ee]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="min-w-0" aria-label={siteName}>
          <Logo siteName={siteName} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.newTab ? "_blank" : undefined}
              rel={link.newTab ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 transition-colors hover:bg-emerald-900/5 hover:text-emerald-900"
            >
              {link.label}
              {link.newTab && <ArrowUpRight className="h-3.5 w-3.5" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {contactWhatsApp && (
            <a
              href={waLink(
                contactWhatsApp,
                "Assalamu'alaikum, saya ingin bertanya tentang Ta'awun Maqom Kuttab Al Fatih Lampung.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("outline", "sm", "hidden sm:inline-flex")}
            >
              Hubungi Admin
            </a>
          )}
          <Link href="/daftar" className={buttonClasses("primary", "sm")}>
            Daftar Ta&apos;awun
          </Link>
          {signedIn && <UserLogoutButton compact />}

          <details className="group relative lg:hidden">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 shadow-sm [&::-webkit-details-marker]:hidden">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Buka menu</span>
            </summary>
            <div className="absolute right-0 top-11 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.newTab ? "_blank" : undefined}
                  rel={link.newTab ? "noopener noreferrer" : undefined}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-900"
                >
                  {link.label}
                  {link.newTab && <ArrowUpRight className="h-3.5 w-3.5" />}
                </Link>
              ))}
              <Link
                href="/admin"
                className="mt-1 flex items-center justify-between rounded-xl border-t border-stone-100 px-3 py-2.5 text-sm font-semibold text-stone-500 hover:bg-stone-50"
              >
                Panel Admin
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
