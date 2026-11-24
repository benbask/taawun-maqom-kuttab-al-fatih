import type { NextRequest } from "next/server";
import { apiError, apiOk, readJson, requireAdminApi, sameOrigin } from "@/lib/api";
import { otpMessage, otpWithCode } from "@/lib/otp";
import { qrDataUrl } from "@/lib/qr-image";
import { getStore } from "@/lib/store";
import { formatDateTime, waLink } from "@/lib/format";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;

  try {
    const store = getStore();
    const [wa, otps, settings] = await Promise.all([
      store.getWaSession(),
      store.listOtpRequests(40),
      store.getSettings(),
    ]);

    const qrImage = wa.qr ? await qrDataUrl(wa.qr).catch(() => null) : null;
    const withCode = otps.map((otp) => {
      const decoded = otpWithCode(otp);
      const code = decoded.code;
      return {
        ...otp,
        code,
        message:
          code && !["verified", "expired"].includes(otp.status)
            ? otpMessage(settings.otp_template, code, settings.otp_expiry_minutes)
            : null,
        manualUrl:
          code && settings.admin_whatsapp
            ? waLink(settings.admin_whatsapp, decoded.code ?? "")
            : null,
      };
    });

    return apiOk({
      session: wa,
      qrImage,
      otps: withCode,
      workerOnline:
        wa.status === "connected" &&
        Boolean(wa.last_heartbeat) &&
        Date.now() - new Date(wa.last_heartbeat as string).getTime() < 2 * 60 * 1000,
      serverTime: formatDateTime(new Date().toISOString()),
    });
  } catch (error) {
    console.error("[admin/wa:get]", error);
    return apiError("Gagal memuat status WhatsApp.", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError("Permintaan tidak valid.", 403);
  const { session, response } = await requireAdminApi();
  if (!session) return response;

  const body = (await readJson(request)) as { action?: string } | null;
  const action = body?.action;
  if (!action || !["logout", "reset"].includes(action)) {
    return apiError("Aksi tidak dikenal.");
  }

  try {
    const store = getStore();
    if (action === "logout") {
      await store.requestWorkerLogout();
    } else {
      await store.resetWaSession();
    }
    await store.addAuditLog({
      actorType: "admin",
      actorId: session.adminId,
      action: `wa_${action}`,
    });
    return apiOk({ action });
  } catch (error) {
    console.error("[admin/wa:post]", error);
    return apiError("Gagal mengubah status WhatsApp.", 500);
  }
}
