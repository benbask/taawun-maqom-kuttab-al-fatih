import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUserApi, sameOrigin } from "@/lib/api";
import { clearUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireUserApi();
  if (!session) return response;
  if (!session.demo) return apiError("Hanya tersedia untuk akun demo.", 403);

  try {
    const store = getStore();
    await store.deleteDemoData();
    await store.addAuditLog({
      actorType: "user",
      actorId: session.phone,
      action: "demo_data_deleted",
      entityType: "system",
      metadata: { phone: session.phone },
    });
    await clearUserSession();
    return apiOk({ deleted: true });
  } catch (error) {
    console.error("[demo/delete]", error);
    return apiError("Gagal menghapus data demo. Silakan coba lagi.", 500);
  }
}
