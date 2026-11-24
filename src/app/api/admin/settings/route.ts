import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, requireAdminApi, sameOrigin } from "@/lib/api";
import { validateQris } from "@/lib/qris";
import { getStore } from "@/lib/store";
import { settingsSchema } from "@/lib/validators";

function nullifyEmpty<T extends Record<string, unknown>>(input: T): T {
  const output: Record<string, unknown> = { ...input };
  for (const [key, value] of Object.entries(output)) {
    if (typeof value === "string" && value.trim() === "") {
      output[key] = null;
    }
  }
  return output as T;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  const body = await readJson(request);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Pengaturan tidak valid.");
  }

  const patch = nullifyEmpty(parsed.data) as Record<string, unknown>;

  if (typeof patch.qris_payload === "string" && patch.qris_payload.length > 0) {
    const validation = validateQris(patch.qris_payload);
    if (!validation.valid) {
      return apiError(`QRIS tidak valid: ${validation.error}`);
    }
    if (!validation.isStatic) {
      return apiError(
        "Gunakan payload QRIS statis (tanpa nominal). QRIS dinamis dibuat otomatis oleh sistem.",
      );
    }
    // Spasi di dalam nilai TLV (mis. nama/kota merchant) adalah bagian dari
    // payload sah. Menghapusnya setelah validasi akan merusak panjang tag dan
    // CRC, sehingga QRIS dinamis gagal dibuat. Simpan persis apa yang lolos
    // validasi.
    patch.qris_merchant_name = validation.merchantName;
    patch.qris_merchant_city = validation.merchantCity;
  }

  if (typeof patch.sheets_webhook_url === "string") {
    try {
      new URL(patch.sheets_webhook_url);
    } catch {
      return apiError("URL webhook Google Sheets tidak valid.");
    }
  }

  if (patch.unique_code_base !== undefined) {
    const base = Number(patch.unique_code_base);
    if (!Number.isInteger(base) || base < 1 || base > 999) {
      return apiError("Kode unik dasar harus 1–999.");
    }
  }

  try {
    const store = getStore();
    const updated = await store.updateSettings(patch);
    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: "settings_updated",
      entityType: "settings",
      entityId: "1",
      metadata: { fields: Object.keys(patch) },
    });

    revalidatePath("/");
    revalidatePath("/verifikasi");
    revalidatePath("/admin");
    revalidatePath("/admin/konten");
    revalidatePath("/admin/qris");
    return apiOk({ settings: updated });
  } catch (error) {
    console.error("[admin/settings]", error);
    return apiError("Gagal menyimpan pengaturan.", 500);
  }
}
