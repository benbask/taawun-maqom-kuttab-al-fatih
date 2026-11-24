import type { NextRequest } from "next/server";
import {
  apiError,
  apiOk,
  readJson,
  sameOrigin,
} from "@/lib/api";
import {
  isGoogleSignInEnabled,
  verifyGoogleIdToken,
} from "@/lib/google";
import {
  clearPendingGoogle,
  setPendingGoogle,
} from "@/lib/google-pending";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { setUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { googleTokenSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);

  if (!isGoogleSignInEnabled()) {
    return apiError("Login Google belum diaktifkan.", 404);
  }

  const limit = rateLimit(`google-login:${getClientIp(request)}`, 12, 10 * 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await readJson(request);
  const parsed = googleTokenSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Token Google tidak valid.");
  }

  try {
    const identity = await verifyGoogleIdToken(parsed.data.credential);
    if (!identity) {
      return apiError("Token Google tidak valid atau sudah kedaluwarsa.", 401);
    }

    const store = getStore();
    const family = await store.getFamilyByGoogleSub(identity.sub);

    if (family) {
      await clearPendingGoogle();
      await setUserSession(family.phone, family.id);
      await store.addAuditLog({
        actorType: "user",
        actorId: family.phone,
        action: "google_login",
        entityType: "family",
        entityId: family.id,
        metadata: { email: identity.email },
      });
      return apiOk({
        linked: true,
        familyId: family.id,
        phone: family.phone,
      });
    }

    await setPendingGoogle(identity);
    await store.addAuditLog({
      actorType: "user",
      actorId: identity.sub,
      action: "google_login_pending",
      entityType: "google",
      entityId: identity.sub,
      metadata: { email: identity.email },
    });
    return apiOk({
      linked: false,
      needsBinding: true,
      name: identity.name,
      email: identity.email,
    });
  } catch (error) {
    console.error("[auth/google]", error);
    return apiError("Gagal memproses login Google.", 500);
  }
}
