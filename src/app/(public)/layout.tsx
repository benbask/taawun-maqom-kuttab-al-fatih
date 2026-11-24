import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { safeSettings } from "@/lib/safe";
import { getUserSession } from "@/lib/session";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await safeSettings();
  const session = await getUserSession();

  return (
    <div className="flex min-h-screen flex-col">
      {session?.demo ? (
        <div className="bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-amber-950">
          Mode demo — data yang Anda buat hanya untuk mencoba dan tidak tampil
          di rekap publik.
        </div>
      ) : null}
      <SiteHeader
        siteName={settings.site_name}
        contactWhatsApp={settings.contact_whatsapp}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
