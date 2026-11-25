import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiError, apiOk, readJson, requireUserApi, sameOrigin } from "@/lib/api";
import { getClientIp } from "@/lib/rate-limit";
import { setUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

const schema = z.object({
  parentName: z.string().trim().min(2, "Nama ayah wajib diisi.").max(100),
  classId: z.string().uuid("Kelas tidak valid."),
  childIds: z.array(z.string().uuid("Data santri tidak valid.")).min(1, "Pilih minimal satu santri."),
  amount: z.coerce
    .number()
    .int("Nominal harus bilangan bulat.")
    .min(1000, "Nominal minimal Rp 1.000.")
    .max(100_000_000, "Nominal terlalu besar."),
  joinMaqom: z.boolean().optional(),
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
    const [directory, classes] = await Promise.all([
      store.listStudentDirectory(),
      store.listClasses(true),
    ]);
    const selected = parsed.data.childIds
      .map((id) => directory.find((entry) => entry.id === id))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (selected.length !== parsed.data.childIds.length) {
      return apiError("Sebagian data santri tidak ditemukan.");
    }
    if (!classes.some((cls) => cls.id === parsed.data.classId)) {
      return apiError("Kelas tidak tersedia.");
    }

    const father = selected[0].father_name;
    if (selected.some((entry) => entry.father_name !== father)) {
      return apiError("Santri yang dipilih harus memiliki ayah yang sama.");
    }

    let family =
      (session.familyId ? await store.getFamilyById(session.familyId) : null) ??
      (await store.getFamilyByPhone(session.phone));

    if (!family) {
      family = await store.createFamily({
        phone: session.phone,
        parentName: parsed.data.parentName,
        consentAt: new Date().toISOString(),
      });
    }

    family = await store.updateFamily(family.id, {
      parent_name: parsed.data.parentName,
      account_type: parsed.data.joinMaqom === false ? "outsider" : "ots",
      custom_data: { ...family.custom_data, father_name: father },
    });

    const saved = [];
    for (const entry of selected) {
      const student = await store.createStudent({
        familyId: family.id,
        name: entry.name,
        classId: classes.find((cls) => cls.name === entry.class_name)?.id ?? null,
        customData: {
          nis: entry.nis,
          father_name: entry.father_name,
          mother_name: entry.mother_name,
          gender: entry.gender,
        },
      });
      saved.push(student);
    }

    const childNames = selected.map((entry) => entry.name).join(", ");
    const invoice = await store.createInvoice({
      familyId: family.id,
      type: "registration",
      items: [
        {
          studentId: saved[0]?.id ?? null,
          classId: parsed.data.classId,
          description: `Ta'awun ${childNames}`,
          amount: parsed.data.amount,
        },
      ],
    });

    await store.addAuditLog({
      actorType: "user",
      actorId: session.phone,
      action: "directory_registration_created",
      entityType: "invoice",
      entityId: invoice.id,
      metadata: {
        parentName: parsed.data.parentName,
        children: childNames,
        classId: parsed.data.classId,
        amount: invoice.base_amount,
        ip: getClientIp(request),
      },
    });

    await setUserSession(session.phone, family.id);
    revalidatePath("/");
    revalidatePath("/akun");
    revalidatePath("/admin/verifikasi");

    return apiOk({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoice_no,
      totalAmount: invoice.total_amount,
    });
  } catch (error) {
    console.error("[registration/directory]", error);
    return apiError("Gagal membuat pendaftaran. Silakan coba lagi.", 500);
  }
}
