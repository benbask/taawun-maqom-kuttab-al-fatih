"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Send,
  Table2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";

export function ExportPanel({ configured }: { configured: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sheets() {
    setLoading("sheets");
    setError(null);
    try {
      const response = await fetch("/api/admin/export/sheets", { method: "POST" });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        sent?: number;
      };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal mengirim ke Sheets.");
        return;
      }
      toast.success(`${data.sent} invoice dikirim ke Google Sheets.`);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <span className="inline-flex rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-sm font-extrabold text-stone-900">Excel XLSX</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Dua sheet: Invoice dan Rincian. Siap difilter dan dicetak.
          </p>
          <a
            href="/api/admin/export?format=xlsx"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
          >
            <Download className="h-3.5 w-3.5" /> Unduh XLSX
          </a>
        </Card>

        <Card className="p-5">
          <span className="inline-flex rounded-xl bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-100">
            <Table2 className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-sm font-extrabold text-stone-900">CSV</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Format Universal, kompatibel dengan Excel, Sheets, dan database.
          </p>
          <a
            href="/api/admin/export?format=csv"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
          >
            <Download className="h-3.5 w-3.5" /> Unduh CSV
          </a>
        </Card>

        <Card className="p-5">
          <span className="inline-flex rounded-xl bg-amber-50 p-2 text-amber-700 ring-1 ring-amber-100">
            <Send className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-sm font-extrabold text-stone-900">Google Sheets</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Kirim seluruh data ke webhook Apps Script yang sudah diatur.
          </p>
          <Button
            className="mt-4 w-full"
            variant={configured ? "primary" : "secondary"}
            size="sm"
            onClick={() => void sheets()}
            disabled={!configured || Boolean(loading)}
          >
            {loading === "sheets" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Kirim ke Sheets
          </Button>
        </Card>
      </div>

      {!configured && (
        <Card className="border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
          Webhook Google Sheets belum diatur. Buka menu QRIS &amp; Pengaturan untuk
          menambahkan URL Apps Script. Pengiriman otomatis juga berjalan saat
          invoice diverifikasi.
        </Card>
      )}

      {error && <FieldError>{error}</FieldError>}

      <Card className="p-5 text-xs leading-relaxed text-stone-600">
        <p className="font-bold text-stone-800">Kolom yang diekspor</p>
        <p className="mt-1">
          No invoice, tanggal, status, tipe, nama wali, WhatsApp, santri, kelas,
          Ta&apos;awun pokok, kode unik, total transfer, waktu unggah bukti,
          waktu verifikasi, dan catatan. Sheet Rincian memuat satu baris per
          santri.
        </p>
      </Card>
    </div>
  );
}
