import "server-only";
import { formatDateTime } from "@/lib/format";
import type { AttendanceRow } from "@/lib/attendance";
import type { InvoiceWithDetails } from "@/lib/types";

export function invoiceExportRows(invoices: InvoiceWithDetails[]) {
  return invoices.map((invoice) => ({
    invoice_no: invoice.invoice_no,
    tanggal_invoice: formatDateTime(invoice.created_at),
    status: invoice.status,
    tipe: invoice.type,
    nama_wali: invoice.family.parent_name,
    whatsapp: invoice.family.phone,
    santri: invoice.items
      .map((item) => item.student?.name ?? item.description ?? "-")
      .join(" | "),
    kelas: invoice.items
      .map((item) => item.class?.name ?? "Umum")
      .join(" | "),
    taawun_pokok: invoice.base_amount,
    kode_unik: invoice.unique_code,
    total_transfer: invoice.total_amount,
    waktu_upload_bukti: invoice.proof_uploaded_at
      ? formatDateTime(invoice.proof_uploaded_at)
      : "",
    waktu_verifikasi: invoice.verified_at ? formatDateTime(invoice.verified_at) : "",
    catatan: invoice.reject_reason ?? invoice.notes ?? "",
  }));
}

export function itemExportRows(invoices: InvoiceWithDetails[]) {
  return invoices.flatMap((invoice) =>
    invoice.items.map((item) => ({
      invoice_no: invoice.invoice_no,
      status: invoice.status,
      nama_wali: invoice.family.parent_name,
      santri: item.student?.name ?? item.description ?? "-",
      kelas: item.class?.name ?? "Umum",
      deskripsi: item.description ?? "",
      nominal: item.amount,
      waktu_verifikasi: invoice.verified_at ? formatDateTime(invoice.verified_at) : "",
    })),
  );
}

export function attendanceExportRows(rows: AttendanceRow[]) {
  return rows.map((row) => ({
    nama_ayah: row.fatherName,
    nama_anak: row.children.join(" | "),
    kelas_anak: row.classes.join(" | "),
    status_hadir:
      row.status === "hadir" ? "Hadir" : row.status === "tidak" ? "Tidak Hadir" : "Belum Pilih",
    whatsapp: row.phone ?? "",
    waktu_update: row.updatedAt ? formatDateTime(row.updatedAt) : "",
  }));
}

export type ExportRow = Record<string, string | number>;

const headers: Record<string, string> = {
  invoice_no: "No Invoice",
  tanggal_invoice: "Tanggal Invoice",
  status: "Status",
  tipe: "Tipe",
  nama_wali: "Nama Wali",
  whatsapp: "WhatsApp",
  santri: "Santri",
  kelas: "Kelas",
  taawun_pokok: "Ta'awun Pokok",
  kode_unik: "Kode Unik",
  total_transfer: "Total Transfer",
  waktu_upload_bukti: "Waktu Upload Bukti",
  waktu_verifikasi: "Waktu Verifikasi",
  catatan: "Catatan",
  deskripsi: "Deskripsi",
  nominal: "Nominal",
  nama_ayah: "Nama Ayah",
  nama_anak: "Nama Anak",
  kelas_anak: "Kelas Anak",
  status_hadir: "Status Kehadiran",
  waktu_update: "Waktu Update",
};

function label(key: string) {
  return headers[key] ?? key;
}

export function toCsv(rows: ExportRow[]) {
  if (!rows.length) return "\uFEFF";
  const keys = Object.keys(rows[0]);
  const escape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const lines = [
    keys.map((key) => escape(label(key))).join(","),
    ...rows.map((row) => keys.map((key) => escape(row[key])).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function tableHeaders(rows: ExportRow[]) {
  const keys = rows.length ? Object.keys(rows[0]) : [];
  return keys.map((key) => ({ key, header: label(key) }));
}
