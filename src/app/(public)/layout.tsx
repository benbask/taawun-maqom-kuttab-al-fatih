import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { safeSettings } from "@/lib/safe";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await safeSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        siteName={settings.site_name}
        contactWhatsApp={settings.contact_whatsapp}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
