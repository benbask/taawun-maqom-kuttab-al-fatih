import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, requireUserApi, sameOrigin } from "@/lib/api";
import { isDemoPhone } from "@/lib/demo";
import { setUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { studentCreateSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireUserApi();
  if (!session) return response;

  const body = await readJson(request);
  const parsed = studentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data santri tidak valid.");
  }

  try {
    const store = getStore();
    const classes = await store.listClasses(true);
    if (!classes.some((cls) => cls.id === parsed.data.classId)) {
      return apiError("Kelas yang dipilih tidak tersedia. Muat ulang halaman.");
    }

    let family =
      (session.familyId ? await store.getFamilyById(session.familyId) : null) ??
      (await store.getFamilyByPhone(session.phone));

    if (!family) {
      family = await store.createFamily({
        phone: session.phone,
        parentName: "Orang tua santri",
        consentAt: new Date().toISOString(),
        isDemo: isDemoPhone(session.phone),
      });
    }

    const student = await store.createStudent({
      familyId: family.id,
      name: parsed.data.name,
      classId: parsed.data.classId,
    });

    if (!family.account_type || family.account_type === "outsider") {
      await store.updateFamily(family.id, { account_type: "ots" });
    }

    await setUserSession(session.phone, family.id);
    revalidatePath("/akun");
    revalidatePath("/daftar");
    revalidatePath("/tambah");

    return apiOk({ student });
  } catch (error) {
    console.error("[students]", error);
    return apiError("Gagal menyimpan data santri.", 500);
  }
}
