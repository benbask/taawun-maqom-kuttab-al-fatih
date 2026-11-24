import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { safeSettings } from "@/lib/safe";

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await safeSettings();

  return (
    <div className="hero-glow relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative w-full max-w-md">
        <div className="mb-5 flex justify-center">
          <Link href="/">
            <Logo siteName={settings.site_name} />
          </Link>
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-stone-500">
          <Link href="/" className="font-semibold text-emerald-800 hover:underline">
            ← Kembali ke situs publik
          </Link>
        </p>
      </div>
    </div>
  );
}
