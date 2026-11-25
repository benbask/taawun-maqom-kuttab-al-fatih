import { DemoBanner } from "@/components/public/demo-banner";
import { UnpaidNotice } from "@/components/public/unpaid-notice";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { safeSettings } from "@/lib/safe";
import { getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await safeSettings();
  const session = await getUserSession();

  let unpaid: Array<{ id: string; invoiceNo: string }> = [];
  if (session) {
    try {
      const store = getStore();
      const family = session.familyId
        ? await store.getFamilyById(session.familyId).catch(() => null)
        : await store.getFamilyByPhone(session.phone).catch(() => null);
      if (family) {
        const invoices = await store.listInvoicesByFamily(family.id).catch(() => []);
        unpaid = invoices
          .filter(
            (invoice) =>
              ["pending", "expired"].includes(invoice.status) && !invoice.proof_url,
          )
          .map((invoice) => ({ id: invoice.id, invoiceNo: invoice.invoice_no }));
      }
    } catch {
      // abaikan: notifikasi hanya pelengkap
    }
  }

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
      {session && unpaid.length > 0 && <UnpaidNotice invoices={unpaid} />}
    </div>
  );
}
