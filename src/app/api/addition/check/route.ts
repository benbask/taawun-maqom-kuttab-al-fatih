import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, readJson, requireUserApi, sameOrigin } from "@/lib/api";
import { normalizeFather } from "@/lib/attendance";
import { getStore } from "@/lib/store";

const schema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, "Pilih santri terlebih dahulu."),
});

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireUserApi();
  if (!session) return response;

  const body = await readJson(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const store = getStore();
    const family =
      (session.familyId ? await store.getFamilyById(session.familyId) : null) ??
      (await store.getFamilyByPhone(session.phone));

    if (!family) return apiOk({ existing: [] });

    const students = await store.listStudents(family.id);
    const selected = students.filter((student) => parsed.data.studentIds.includes(student.id));
    const fathers = new Set(
      selected
        .map((student) => {
          const value = (student.custom_data as { father_name?: unknown })?.father_name;
          return typeof value === "string" ? normalizeFather(value) : "";
        })
        .filter(Boolean),
    );

    if (!fathers.size) return apiOk({ existing: [] });

    const invoices = await store.listAllInvoices();
    const existing = invoices
      .filter((invoice) => {
        if (invoice.family_id === family.id) return false;
        if (!["verified", "waiting_verification"].includes(invoice.status)) return false;
        return fathers.has(normalizeFather(invoice.family.parent_name));
      })
      .map((invoice) => ({
        familyId: invoice.family_id,
        fatherName: invoice.family.parent_name,
        invoiceNo: invoice.invoice_no,
        amount: invoice.base_amount,
        status: invoice.status,
      }));

    return apiOk({ existing });
  } catch (error) {
    console.error("[addition/check]", error);
    return apiError("Gagal memeriksa data Ta'awun sebelumnya.", 500);
  }
}
