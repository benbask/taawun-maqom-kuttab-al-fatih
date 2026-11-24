import type { NextRequest } from "next/server";
import {
  apiError,
  apiOk,
  readJson,
  requireUserApi,
  sameOrigin,
} from "@/lib/api";
import { clearPendingGoogle, getPendingGoogle } from "@/lib/google-pending";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { setUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { googleBindSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireUserApi();
  if (!session) return response;

  const limit = rateLimit(`google-bind:${getClientIp(request)}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await readJson(request);
  const parsed = googleBindSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Konfirmasi tidak valid.");
  }

  const pending = await getPendingGoogle();
  if (!pending) {
    return apiError("Sesi Google sudah berakhir. Silakan masuk dengan Google lagi.", 410);
  }

  try {
    const store = getStore();
    let family =
      (session.familyId ? await store.getFamilyById(session.familyId) : null) ??
      (await store.getFamilyByPhone(session.phone));

    if (!family) {
      family = await store.createFamily({
        phone: session.phone,
        parentName: pending.name?.trim() || "Wali Ta'awun",
        consentAt: new Date().toISOString(),
      });
    }

    if (family.google_sub && family.google_sub !== pending.sub) {
      return apiError(
        "Keluarga ini sudah terhubung dengan akun Google lain. Hubungi admin.",
        409,
      );
    }

    const updated = await store.linkGoogleToFamily(family.id, {
      googleSub: pending.sub,
      email: pending.email,
      verifiedAt: new Date().toISOString(),
    });

    await clearPendingGoogle();
    await setUserSession(session.phone, updated.id);
    await store.addAuditLog({
      actorType: "user",
      actorId: session.phone,
      action: "google_linked",
      entityType: "family",
      entityId: updated.id,
      metadata: { email: pending.email, sub: pending.sub },
    });

    return apiOk({ linked: true, familyId: updated.id });
  } catch (error) {
    console.error("[auth/google/bind]", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal menghubungkan akun Google.",
      500,
    );
  }
}
