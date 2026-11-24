import type { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { apiError, requireAdminApi } from "@/lib/api";
import {
  invoiceExportRows,
  itemExportRows,
  tableHeaders,
  toCsv,
  type ExportRow,
} from "@/lib/export";
import { getStore } from "@/lib/store";

function filename(extension: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `taawun-maqom-kuttab-${date}.${extension}`;
}

function addSheet(workbook: ExcelJS.Workbook, name: string, rows: ExportRow[]) {
  const sheet = workbook.addWorksheet(name);
  const columns = tableHeaders(rows);
  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: Math.max(14, Math.min(42, column.header.length + 6)),
  }));
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF065F46" },
  };
  sheet.getRow(1).height = 22;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: Math.max(1, columns.length) },
  };
  sheet.eachRow((row, number) => {
    if (number > 1) {
      row.alignment = { vertical: "middle", wrapText: false };
    }
  });
  return sheet;
}

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const format = request.nextUrl.searchParams.get("format") ?? "xlsx";

  try {
    const store = getStore();
    const invoices = await store.listAllInvoices();
    const rows = invoiceExportRows(invoices);

    if (format === "csv") {
      return new Response(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename("csv")}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Ta'awun Maqom Kuttab Al Fatih Lampung";
    workbook.created = new Date();
    addSheet(workbook, "Invoice", rows);
    addSheet(workbook, "Rincian", itemExportRows(invoices));

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename("xlsx")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin/export]", error);
    return apiError("Gagal membuat file ekspor.", 500);
  }
}
