import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPhoneIntl, waLink } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Pendaftar Alumni",
  robots: { index: false, follow: false },
};

export default async function AdminAlumniPage() {
  const rows = await getStore().listAlumni();

  return (
    <div>
      <PageHeader
        eyebrow="Pengguna"
        title="Alumni yang ingin ikut Maqom"
        description="Data alumni yang memilih ikut Maqom setelah verifikasi WhatsApp."
      />

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-500">
            Belum ada alumni yang mendaftar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Angkatan</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Kota</th>
                  <th className="px-4 py-3">Catatan</th>
                  <th className="px-4 py-3">Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((row) => {
                  const profile = row.alumni_profile ?? {};
                  return (
                    <tr key={row.id} className="text-xs text-stone-700">
                      <td className="px-4 py-3 font-bold text-stone-900">
                        <Link
                          href={`/admin/ots/${row.id}`}
                          className="hover:text-emerald-700 hover:underline"
                        >
                          {profile.nama || row.parent_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{profile.angkatan || "-"}</td>
                      <td className="px-4 py-3">
                        <a
                          href={waLink(profile.whatsapp || row.phone, `Assalamu'alaikum ${profile.nama || row.parent_name}, ...`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                        >
                          <MessageCircle className="h-3 w-3" />
                          {formatPhoneIntl(profile.whatsapp || row.phone)}
                        </a>
                      </td>
                      <td className="px-4 py-3">{profile.kota || "-"}</td>
                      <td className="px-4 py-3 text-stone-500">{profile.catatan || "-"}</td>
                      <td className="px-4 py-3 text-stone-500">
                        {formatDateTime(row.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
