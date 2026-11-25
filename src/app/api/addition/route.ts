import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, requireUserApi, sameOrigin } from "@/lib/api";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { setUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { additionSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireUserApi();
  if (!session) return response;

  const limit = rateLimit(`addition:${session.phone}`, 6, 60 * 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await readJson(request);
  const parsed = additionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const store = getStore();
    let family =
      (session.familyId ? await store.getFamilyById(session.familyId) : null) ??
      (await store.getFamilyByPhone(session.phone));

    if (!family) {
      family = await store.createFamily({
        phone: session.phone,
        parentName: "Donatur Ta'awun",
        customData: {},
        consentAt: new Date().toISOString(),
      });
    }
    if (parsed.data.linkFamilyId && parsed.data.linkFamilyId !== family.id) {
      const target = await store.getFamilyById(parsed.data.linkFamilyId);
      if (!target) return apiError("Keluarga tujuan tidak ditemukan.", 404);

      const currentPhones = (target.custom_data as { linked_phones?: unknown }).linked_phones;
      const phones = Array.isArray(currentPhones)
        ? currentPhones.filter((phone): phone is string => typeof phone === "string")
        : [];
      if (!phones.includes(session.phone)) phones.push(session.phone);

      await store.updateFamily(target.id, {
        custom_data: { ...target.custom_data, linked_phones: phones },
      });
      await store.updateFamily(family.id, {
        custom_data: { ...family.custom_data, linked_family_id: target.id },
      });
      family = {
        ...target,
        custom_data: { ...target.custom_data, linked_phones: phones },
      };
    }

    const familyId = family.id;

    let classId = parsed.data.classId ?? null;
    const studentId = parsed.data.studentId ?? null;
    let description = parsed.data.note?.trim() || "Ta'awun tambahan";

    if (studentId) {
      const students = await store.listStudents(familyId);
      const student = students.find((item) => item.id === studentId);
      if (!student) return apiError("Santri tidak ditemukan pada keluarga ini.", 403);
      classId = student.class_id;
      description = `Ta'awun ${student.name}`;
    } else if (classId) {
      const classes = await store.listClasses(true);
      if (!classes.some((cls) => cls.id === classId)) {
        return apiError("Kelas tidak ditemukan.", 404);
      }
      const className = classes.find((cls) => cls.id === classId)?.name ?? "kelas";
      description = description || `Ta'awun ${className}`;
    } else {
      description = parsed.data.note?.trim() || "Ta'awun umum";
    }

    const invoice = await store.createInvoice({
      familyId,
      type: "addition",
      items: [
        {
          studentId,
          classId,
          description,
          amount: parsed.data.amount,
        },
      ],
    });

    await store.addAuditLog({
      actorType: "user",
      actorId: session.phone,
      action: "addition_created",
      entityType: "invoice",
      entityId: invoice.id,
      metadata: {
        amount: invoice.base_amount,
        classId,
        studentId,
        linkFamilyId: parsed.data.linkFamilyId ?? null,
        ip: getClientIp(request),
      },
    });

    await setUserSession(session.phone, familyId);
    revalidatePath("/");
    revalidatePath("/akun");
    return apiOk({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoice_no,
      totalAmount: invoice.total_amount,
    });
  } catch (error) {
    console.error("[addition]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal membuat invoice tambahan.",
      500,
    );
  }
}
