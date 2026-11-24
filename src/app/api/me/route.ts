import { apiError, apiOk, requireUserApi } from "@/lib/api";
import { getStore } from "@/lib/store";

export async function GET() {
  const { session, response } = await requireUserApi();
  if (!session) return response;

  try {
    const store = getStore();
    const family = session.familyId
      ? await store.getFamilyById(session.familyId)
      : await store.getFamilyByPhone(session.phone);
    const students = family ? await store.listStudents(family.id) : [];

    return apiOk({
      phone: session.phone,
      family,
      students,
      classes: await store.listClasses(true),
    });
  } catch (error) {
    console.error("[me]", error);
    return apiError("Gagal memuat data akun.", 500);
  }
}
