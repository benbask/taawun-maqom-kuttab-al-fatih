import type { Metadata } from "next";
import Link from "next/link";
import { Download, MessageCircle, UserCheck, UserX, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import {
  attendanceLabels,
  buildAttendance,
  type AttendanceStatus,
} from "@/lib/attendance";
import { formatPhoneIntl, waLink } from "@/lib/format";
import { getStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Daftar Hadir Ayah",
  robots: { index: false, follow: false },
};

const tone: Record<AttendanceStatus, "green" | "amber" | "stone"> = {
  hadir: "green",
  tidak: "amber",
  belum: "stone",
};

export default async function AdminAttendancePage() {
  const store = getStore();
  const [entries, families] = await Promise.all([
    store.listStudentDirectory().catch(() => []),
    store.listAllFamilies().catch(() => []),
  ]);
  const rows = buildAttendance(entries, families);
  const hadir = rows.filter((row) => row.status === "hadir").length;
  const tidak = rows.filter((row) => row.status === "tidak").length;
  const belum = rows.filter((row) => row.status === "belum").length;

  return (
    <div>
      <PageHeader
        eyebrow="Maqom"
        title="Daftar hadir ayah"
        description="Status diambil dari pilihan user saat mendaftar: ikut Maqom atau hanya Ta'awun. Satu ayah = satu peserta."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/api/admin/attendance/export?format=xlsx"
              className={buttonClasses("primary", "sm")}
            >
              <Download className="h-3.5 w-3.5" /> Ekspor XLSX
            </Link>
            <Link
              href="/api/admin/attendance/export?format=csv"
              className={buttonClasses("outline", "sm")}
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </Link>
          </div>
        }
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Stat icon={UserCheck} label="Hadir / ikut Maqom" value={hadir} tone="emerald" />
        <Stat icon={UserX} label="Tidak hadir" value={tidak} tone="amber" />
        <Stat icon={Users} label="Belum memilih" value={belum} tone="stone" />
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-left text-[11px] uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3 font-semibold">Nama ayah</th>
                <th className="px-4 py-3 font-semibold">Anak</th>
                <th className="px-4 py-3 font-semibold">Kelas</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((row) => (
                <tr key={row.fatherName} className="bg-white hover:bg-stone-50/60">
                  <td className="px-4 py-3 text-xs font-bold text-stone-800">
                    {row.familyId ? (
                      <Link
                        href={`/admin/ots/${row.familyId}`}
                        className="hover:text-emerald-700 hover:underline"
                      >
                        {row.fatherName}
                      </Link>
                    ) : (
                      row.fatherName
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-600">
                    {row.children.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {row.classes.join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={tone[row.status]}>{attendanceLabels[row.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-stone-500">
                    {row.phone ? (
                      <a
                        href={waLink(row.phone, `Assalamu'alaikum ${row.fatherName}, ...`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-sans font-bold text-emerald-700 hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" /> {formatPhoneIntl(row.phone)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-500">
                    Data santri belum tersedia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
        Status “Hadir” berasal dari pilihan {" "}
        <strong>Insyaallah saya ikut Maqom</strong> (OTS Aktif/Alumni). Status “Tidak
        hadir” berasal dari pilihan <strong>Tidak ikut, hanya Ta&apos;awun</strong>.
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "emerald" | "amber" | "stone";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    stone: "bg-stone-100 text-stone-600",
  } as const;
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={cn("rounded-xl p-2.5", colors[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-xl font-extrabold text-emerald-950">{value} ayah</p>
      </div>
    </Card>
  );
}
