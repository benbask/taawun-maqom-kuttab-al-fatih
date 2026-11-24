import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, requireUserApi, sameOrigin } from "@/lib/api";
import { getStore } from "@/lib/store";
import { setUserSession } from "@/lib/session";
import { registrationSchema } from "@/lib/validators";
import type { FormField } from "@/lib/types";

function isBlank(value: unknown) {
  if (value === undefined || value === null) return true;
  if (typeof value === "boolean") return !value;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function missingFields(fields: FormField[], data: Record<string, unknown>) {
  return fields
    .filter((field) => field.required && isBlank(data[field.key]))
    .map((field) => field.label);
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireUserApi();
  if (!session) return response;

  const body = await readJson(request);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data pendaftaran tidak valid.");
  }

  try {
    const store = getStore();
    const [classes, fields] = await Promise.all([
      store.listClasses(true),
      store.listFormFields(true),
    ]);

    for (const child of parsed.data.children) {
      if (!classes.some((cls) => cls.id === child.classId)) {
        return apiError("Kelas yang dipilih tidak tersedia. Muat ulang halaman.");
      }
    }

    const familyFields = fields.filter((field) => field.scope === "family");
    const studentFields = fields.filter((field) => field.scope === "student");
    const familyCustom = parsed.data.customData ?? {};

    const missingFamily = missingFields(familyFields, familyCustom);
    if (missingFamily.length) {
      return apiError(`Lengkapi data: ${missingFamily.join(", ")}.`);
    }

    for (const child of parsed.data.children) {
      const missingStudent = missingFields(studentFields, child.customData ?? {});
      if (missingStudent.length) {
        return apiError(
          `Lengkapi data ${child.name}: ${missingStudent.join(", ")}.`,
        );
      }
    }

    let family = session.familyId
      ? await store.getFamilyById(session.familyId)
      : await store.getFamilyByPhone(session.phone);

    if (family) {
      family = await store.updateFamily(family.id, {
        parent_name: parsed.data.parentName,
        custom_data: { ...family.custom_data, ...familyCustom },
      });
    } else {
      family = await store.createFamily({
        phone: session.phone,
        parentName: parsed.data.parentName,
        customData: familyCustom,
        consentAt: new Date().toISOString(),
      });
    }

    const created = [];
    for (const child of parsed.data.children) {
      const student = await store.createStudent({
        familyId: family.id,
        name: child.name,
        classId: child.classId,
        customData: child.customData ?? {},
      });
      created.push(student);
    }

    const invoice = await store.createInvoice({
      familyId: family.id,
      type: "registration",
      items: created.map((student, index) => ({
        studentId: student.id,
        classId: parsed.data.children[index].classId,
        description: `Ta'awun ${student.name}`,
        amount: parsed.data.children[index].amount,
      })),
    });

    await store.addAuditLog({
      actorType: "user",
      actorId: family.phone,
      action: "registration_created",
      entityType: "invoice",
      entityId: invoice.id,
      metadata: {
        children: created.length,
        total: invoice.total_amount,
        parentName: parsed.data.parentName,
      },
    });

    await setUserSession(session.phone, family.id);
    revalidatePath("/");
    revalidatePath("/akun");

    return apiOk({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoice_no,
      totalAmount: invoice.total_amount,
    });
  } catch (error) {
    console.error("[register]", error);
    const message = error instanceof Error ? error.message : "Gagal membuat invoice.";
    return apiError(message, 500);
  }
}
