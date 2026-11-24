import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
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
        return apiError("Anda tidak berhak melihat invoice ini.", 403);
      }
    }

    return apiOk({
      id: invoice.id,
      status: invoice.status,
      totalAmount: invoice.total_amount,
      proofUploadedAt: invoice.proof_uploaded_at,
      verifiedAt: invoice.verified_at,
      rejectReason: invoice.reject_reason,
      updatedAt: invoice.updated_at,
    });
  } catch (error) {
    console.error("[invoice/status]", error);
    return apiError("Gagal memuat status invoice.", 500);
  }
}
