import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { getAdminSession, getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const [admin, user] = await Promise.all([getAdminSession(), getUserSession()]);
  if (!admin && !user) return apiError("Silakan masuk terlebih dahulu.", 401);

  try {
    const store = getStore();
    const invoice = await store.getInvoiceById(id);
    if (!invoice) return apiError("Invoice tidak ditemukan.", 404);

    if (!admin) {
      const familyId =
        user?.familyId ??
        (user ? (await store.getFamilyByPhone(user.phone))?.id ?? null : null);
      if (!familyId || invoice.family_id !== familyId) {
        return apiError("Anda tidak berhak melihat bukti ini.", 403);
      }
    }

    const proof = await store.getProofResponse(id);
    if (!proof) return apiError("Bukti transfer tidak tersedia.", 404);
    return proof;
  } catch (error) {
    console.error("[invoice/proof:get]", error);
    return apiError("Gagal mengambil bukti transfer.", 500);
  }
}
