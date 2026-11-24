import type { NextRequest } from "next/server";
import { apiError, apiOk, readJson, requireUserApi, sameOrigin } from "@/lib/api";
import { alumniProfileSchema, isAccountRole } from "@/lib/account-roles";
import { getStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireUserApi();
  if (!session) return response;

  const body = (await readJson(request)) as Record<string, unknown>;
  if (!isAccountRole(body.role)) {
    return apiError("Peran tidak dikenali.", 400);
  }
  const role = body.role;

  let profile: Record<string, unknown> | undefined;
  if (role === "alumni_join") {
    const parsed = alumniProfileSchema.safeParse(body.profile ?? {});
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data alumni tidak valid.", 400);
    }
    profile = parsed.data as Record<string, unknown>;
  }

  try {
    const store = getStore();
    let family = session.familyId
      ? await store.getFamilyById(session.familyId)
      : await store.getFamilyByPhone(session.phone);

    if (!family) {
      family = await store.createFamily({
        phone: session.phone,
        parentName:
          role === "alumni_join" && typeof profile?.nama === "string"
            ? profile.nama
            : "Donatur Ta'awun",
        consentAt: new Date().toISOString(),
      });
    }

    const updated = await store.updateFamily(family.id, {
      account_type: role,
      ...(profile ? { alumni_profile: profile } : {}),
    });

    await store.addAuditLog({
      actorType: "user",
      actorId: session.phone,
      action: "account_role_set",
      entityType: "family",
      entityId: updated.id,
      metadata: { role },
    });

    return apiOk({
      ok: true,
      role: updated.account_type,
      familyId: updated.id,
      destination:
        role === "alumni_join"
          ? "/alumni"
          : role === "ots"
            ? "/daftar"
            : "/tambah",
    });
  } catch (error) {
    console.error("[account/role]", error);
    return apiError("Gagal menyimpan peran. Silakan coba lagi.", 500);
  }
}
