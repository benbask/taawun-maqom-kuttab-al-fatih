import type { NextRequest } from "next/server";
import { apiError, apiOk, requireAdminApi, sameOrigin } from "@/lib/api";
import { UPLOAD_MAX_BYTES } from "@/lib/env";
import { getStore } from "@/lib/store";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = Math.min(UPLOAD_MAX_BYTES, 4 * 1024 * 1024);

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return apiError("Pilih gambar terlebih dahulu.");
    }
    if (!ALLOWED.includes(file.type)) {
      return apiError("Format gambar harus JPG, PNG, atau WEBP.");
    }
    if (file.size > MAX_BYTES) {
      return apiError("Ukuran gambar maksimal 4 MB.");
    }

    const store = getStore();
    const uploaded = await store.uploadPublicImage({
      file,
      folder: "settings",
    });

    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: "asset_uploaded",
      entityType: "settings",
      entityId: "1",
      metadata: { size: file.size, type: file.type },
    });

    return apiOk({ url: uploaded.url });
  } catch (error) {
    console.error("[admin/upload]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal mengunggah gambar.",
      500,
    );
  }
}
