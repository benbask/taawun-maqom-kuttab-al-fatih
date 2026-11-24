import type { Metadata } from "next";
import { History, Lock, ShieldCheck, UserRound, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { formatDateTime } from "@/lib/format";
import { getStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Audit Log",
  robots: { index: false, follow: false },
};

const labels: Record<string, string> = {
  admin_login: "Admin masuk",
  admin_setup: "Admin dibuat",
  admin_password_changed: "Password diubah",
  registration_created: "Pendaftaran dibuat",
  addition_created: "Ta'awun tambahan",
  proof_uploaded: "Bukti diunggah",
  invoice_verified: "Invoice diverifikasi",
  invoice_rejected: "Invoice ditolak",
  invoice_cancelled: "Invoice dibatalkan",
  settings_updated: "Pengaturan diubah",
  class_created: "Kelas dibuat",
  class_updated: "Kelas diubah",
  class_deactivated: "Kelas dinonaktifkan",
  field_created: "Field dibuat",
  field_updated: "Field diubah",
  field_deactivated: "Field dinonaktifkan",
  sheets_synced: "Sinkron Sheets berhasil",
  sheets_sync_failed: "Sinkron Sheets gagal",
  sheets_exported: "Ekspor Sheets",
  wa_logout: "Logout WhatsApp",
  wa_reset: "Reset WhatsApp",
};

export default async function AdminAuditPage() {
  const logs = await getStore().listAuditLogs(150);

  return (
    <div>
      <PageHeader
        eyebrow="Sistem"
        title="Audit log"
        description="Catatan aktivitas admin, pengguna, dan sistem untuk keperluan pelacakan."
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
          <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700">
            <History className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-stone-900">Aktivitas terbaru</p>
            <p className="text-xs text-stone-500">{logs.length} entri ditampilkan</p>
          </div>
        </div>
        <div className="divide-y divide-stone-100">
          {logs.map((log) => {
            const Icon =
              log.actor_type === "admin"
                ? ShieldCheck
                : log.actor_type === "user"
                  ? UserRound
                  : log.actor_type === "worker"
                    ? Lock
                    : Users;
            return (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={cn(
                    "mt-0.5 rounded-lg p-1.5",
                    log.actor_type === "admin"
                      ? "bg-emerald-50 text-emerald-700"
                      : log.actor_type === "user"
                        ? "bg-sky-50 text-sky-700"
                        : "bg-stone-100 text-stone-600",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800">
                    {labels[log.action] ?? log.action}
                  </p>
                  <p className="truncate font-mono text-[11px] text-stone-400">
                    {log.actor_type}: {log.actor_id ?? "system"}
                    {log.entity_id ? ` → ${log.entity_id}` : ""}
                  </p>
                  {Object.keys(log.metadata ?? {}).length > 0 && (
                    <pre className="mt-1 max-w-full overflow-x-auto rounded-lg bg-stone-50 p-2 text-[10px] text-stone-500">
                      {JSON.stringify(log.metadata)}
                    </pre>
                  )}
                </div>
                <p className="shrink-0 text-[11px] text-stone-400">
                  {formatDateTime(log.created_at)}
                </p>
              </div>
            );
          })}
          {logs.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-stone-500">
              Belum ada aktivitas tercatat.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
