import "server-only";
import { getStore } from "@/lib/store";
import { DEMO_CODE, isDemoPhone } from "@/lib/demo";
import { decryptSecret, encryptSecret, hashOtp, randomOtp, timingSafeEqualText } from "@/lib/crypto";
import { isDemoMode } from "@/lib/env";
import type { OtpRequest, OtpRequestWithCode } from "@/lib/types";

export interface RequestOtpResult {
  otp: OtpRequest;
  demoCode: string | null;
  workerOnline: boolean;
  expiresAt: string;
}

function isWorkerOnline(status: string, heartbeat: string | null) {
  if (status !== "connected" || !heartbeat) return false;
  return Date.now() - new Date(heartbeat).getTime() < 2 * 60 * 1000;
}

export async function requestOtp(phone: string, ip: string): Promise<RequestOtpResult> {
  const store = getStore();
  const settings = await store.getSettings();
  const demo = isDemoPhone(phone);
  const code = demo ? DEMO_CODE : randomOtp();
  const expiresAt = new Date(
    Date.now() + settings.otp_expiry_minutes * 60 * 1000,
  ).toISOString();

  const otp = await store.createOtp({
    phone,
    codeHash: hashOtp(phone, code),
    codeEncrypted: encryptSecret(code),
    expiresAt,
    requestedIp: ip,
  });

  // OTP demo tidak dikirim lewat WhatsApp; tandai langsung sebagai terkirim
  // supaya worker tidak mencoba mengirim ke nomor contoh.
  if (demo) await store.markOtpSent(otp.id, "sent", null);

  const worker = await store.getWaSession();
  const workerOnline = demo || isWorkerOnline(worker.status, worker.last_heartbeat);

  await store.addAuditLog({
    actorType: "system",
    actorId: phone,
    action: demo ? "otp_demo_requested" : "otp_requested",
    entityType: "otp",
    entityId: otp.id,
    metadata: { phone, workerOnline, demo },
  });

  return {
    otp,
    demoCode: demo || isDemoMode ? code : null,
    workerOnline,
    expiresAt,
  };
}

export type VerifyOtpResult =
  | { ok: true; familyId: string | null }
  | { ok: false; error: string; attemptsLeft?: number };

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const store = getStore();
  const otp = await store.getLatestOtp(phone);

  if (!otp) return { ok: false, error: "Kode tidak ditemukan. Silakan minta kode baru." };
  if (otp.status === "verified") {
    return { ok: false, error: "Kode sudah dipakai. Silakan minta kode baru." };
  }
  if (!["pending", "sending", "sent", "failed"].includes(otp.status)) {
    return { ok: false, error: "Kode sudah tidak berlaku. Silakan minta kode baru." };
  }
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Kode sudah kedaluwarsa. Silakan minta kode baru." };
  }
  if (otp.attempts >= 5 && !isDemoPhone(phone)) {
    return { ok: false, error: "Terlalu banyak percobaan. Silakan minta kode baru." };
  }

  const expected = hashOtp(phone, code);
  if (!timingSafeEqualText(expected, otp.code_hash)) {
    if (isDemoPhone(phone)) {
      return {
        ok: false,
        error: "Kode salah. Untuk mode demo gunakan kode 8888.",
      };
    }
    const attempts = await store.incrementOtpAttempts(otp.id);
    return {
      ok: false,
      error: "Kode salah. Periksa kembali pesan WhatsApp Anda.",
      attemptsLeft: Math.max(0, 5 - attempts),
    };
  }

  await store.markOtpVerified(otp.id);
  const family = await store.getFamilyByPhone(phone);

  await store.addAuditLog({
    actorType: "user",
    actorId: phone,
    action: "otp_verified",
    entityType: "otp",
    entityId: otp.id,
    metadata: { hasFamily: Boolean(family) },
  });

  return { ok: true, familyId: family?.id ?? null };
}

export function otpMessage(
  template: string,
  code: string,
  minutes: number,
) {
  return template
    .replaceAll("{{kode}}", code)
    .replaceAll("{{menit}}", String(minutes))
    .replaceAll("{{kode_otp}}", code);
}

export function otpWithCode(otp: OtpRequest): OtpRequestWithCode {
  return { ...otp, code: decryptSecret(otp.code_encrypted) };
}

export function formatOtpStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu dikirim",
    sending: "Sedang dikirim",
    sent: "Terkirim",
    failed: "Gagal",
    verified: "Terverifikasi",
    expired: "Kedaluwarsa",
  };
  return labels[status] ?? status;
}
