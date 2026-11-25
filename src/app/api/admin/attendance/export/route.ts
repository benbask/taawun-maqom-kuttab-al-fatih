import type { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { apiError, requireAdminApi } from "@/lib/api";
import { buildAttendance } from "@/lib/attendance";
import {
  attendanceExportRows,
  tableHeaders,
  toCsv,
  type ExportRow,
} from "@/lib/export";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const format = request.nextUrl.searchParams.get("format") ?? "xlsx";

  try {
    const store = getStore();
    const [entries, families] = await Promise.all([
      store.listStudentDirectory(),
      store.listAllFamilies(),
    ]);
    const rows: ExportRow[] = attendanceExportRows(buildAttendance(entries, families));
    const date = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      return new Response(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="daftar-hadir-ayah-${date}.csv"`,
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Daftar Hadir Ayah");
    const columns = tableHeaders(rows);
    sheet.columns = columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: Math.max(16, Math.min(48, column.header.length + 8)),
    }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF065F46" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: Math.max(1, columns.length) },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="daftar-hadir-ayah-${date}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[attendance/export]", error);
    return apiError("Gagal mengekspor daftar hadir.", 500);
  }
}
