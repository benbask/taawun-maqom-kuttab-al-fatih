import { apiError, apiOk, requireUserApi } from "@/lib/api";
import { getStore } from "@/lib/store";

export async function GET() {
  const { session, response } = await requireUserApi();
  if (!session) return response;

  try {
    const entries = await getStore().listStudentDirectory();
    return apiOk({ entries });
  } catch (error) {
    console.error("[directory]", error);
    return apiError("Gagal memuat data santri.", 500);
  }
}
