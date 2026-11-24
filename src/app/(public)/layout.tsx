import { DemoBanner } from "@/components/public/demo-banner";
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
      {session?.demo ? <DemoBanner /> : null}
      <SiteHeader
        siteName={settings.site_name}
        contactWhatsApp={settings.contact_whatsapp}
        signedIn={Boolean(session)}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
