import Link from "next/link";
import { ShieldX } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";

export const metadata = {
  title: "Akses ditolak",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Akses ditolak"
        description="Akun Anda tidak memiliki hak untuk membuka menu tersebut."
      />
      <Card className="flex flex-col items-start gap-4 p-6">
        <span className="rounded-xl bg-rose-50 p-3 text-rose-700 ring-1 ring-rose-100">
          <ShieldX className="h-6 w-6" />
        </span>
        <p className="text-sm leading-relaxed text-stone-600">
          Hubungi super admin jika Anda memerlukan akses tambahan. Cakupan hak
          tiap akun dapat diatur di menu <strong>Akun Admin</strong>.
        </p>
        <Link href="/admin" className={buttonClasses("primary", "sm")}>
          Kembali ke ringkasan
        </Link>
      </Card>
    </div>
  );
}
