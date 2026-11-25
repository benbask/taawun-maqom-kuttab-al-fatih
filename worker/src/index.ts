import fs from "node:fs/promises";
import QRCode from "qrcode";
import pino from "pino";
import {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import { config } from "./config.js";
import {
  addAuditLog,
  claimOtp,
  getWaSession,
  listPendingOtps,
  markOtpFailed,
  markOtpSent,
  updateWaSession,
} from "./db.js";
import { decryptOtp, renderOtpMessage } from "./crypto.js";

const log = pino({ level: config.logLevel });
const logger = pino({ level: "silent" });

let sock: WASocket | null = null;
let connected = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let lastDbStatus = "";
const processing = new Set<string>();

async function clearAuth() {
  await fs.rm(config.authDir, { recursive: true, force: true });
  await fs.mkdir(config.authDir, { recursive: true });
  log.info("Sesi WhatsApp dihapus. Menunggu pemindaian QR ulang.");
}

function scheduleReconnect(delay = 4000) {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connect();
  }, delay);
}

async function connect() {
  try {
    if (sock) {
      try {
        sock.ev.removeAllListeners("connection.update");
      } catch {
        // abaikan
      }
    }

    const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
      version,
      auth: state,
      browser: Browsers.macOS("Chrome"),
      logger,
      printQRInTerminal: false,
      syncFullHistory: false,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        connected = false;
        try {
          const terminal = await QRCode.toString(qr, { type: "terminal", small: true });
          log.info(`\n${terminal}`);
        } catch {
          // abaikan
        }
        await updateWaSession({
          status: "qr",
          qr,
          connected_phone: null,
        });
        log.info("QR login tersedia di panel admin /admin/whatsapp.");
      }

      if (connection === "connecting") {
        await updateWaSession({ status: "connecting" });
      }

      if (connection === "open") {
        connected = true;
        const rawId = sock?.user?.id ?? "";
        const phone = rawId.split(":")[0].split("@")[0] || null;
        await updateWaSession({
          status: "connected",
          connected_phone: phone,
          qr: null,
          last_error: null,
          last_heartbeat: new Date().toISOString(),
        });
        await addAuditLog("wa_connected", { phone });
        log.info({ phone }, "WhatsApp terhubung.");
      }

      if (connection === "close") {
        connected = false;
        const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
          ?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        const reason = lastDisconnect?.error instanceof Error
          ? lastDisconnect.error.message
          : "Koneksi terputus";
        const visibleReason = loggedOut
          ? "Sesi WhatsApp dicabut server WhatsApp (kode 401). Perlu pindai QR ulang."
          : reason;
        await updateWaSession({
          status: "disconnected",
          last_error: visibleReason,
        });
        await addAuditLog(loggedOut ? "wa_logged_out" : "wa_disconnected", {
          statusCode: statusCode ?? null,
          reason,
          loggedOut,
        });
        if (loggedOut) {
          await clearAuth();
          await updateWaSession({ connected_phone: null, qr: null });
        }
        log.warn({ statusCode, loggedOut, reason }, "Koneksi WhatsApp terputus.");
        scheduleReconnect(loggedOut ? 2000 : 5000);
      }
    });
  } catch (error) {
    log.error(error, "Gagal menghubungkan WhatsApp. Coba lagi...");
    await updateWaSession({
      status: "error",
      last_error: error instanceof Error ? error.message : String(error),
    }).catch(() => undefined);
    scheduleReconnect(10_000);
  }
}

async function heartbeat() {
  try {
    const session = await getWaSession();

    if (session.logout_requested) {
      log.info("Permintaan logout diterima.");
      await updateWaSession({ status: "disconnected", logout_requested: false });
      connected = false;
      if (sock) {
        try {
          await sock.logout();
        } catch {
          // abaikan
        }
        sock.ev.removeAllListeners("connection.update");
        sock = null;
      }
      await clearAuth();
      scheduleReconnect(1500);
      return;
    }

    // Admin menekan "Reset sesi": status dikembalikan ke disconnected.
    if (lastDbStatus === "connected" && session.status === "disconnected") {
      log.info("Reset sesi terdeteksi.");
      connected = false;
      if (sock) {
        sock.ev.removeAllListeners("connection.update");
        sock = null;
      }
      await clearAuth();
      scheduleReconnect(1500);
      return;
    }
    lastDbStatus = session.status;

    if (connected) {
      await updateWaSession({ last_heartbeat: new Date().toISOString() });
    }
  } catch (error) {
    log.warn(error, "Heartbeat gagal.");
  }
}

async function sendOtps() {
  if (!connected || !sock) return;

  let rows;
  try {
    rows = await listPendingOtps();
  } catch (error) {
    log.warn(error, "Gagal membaca antrean OTP.");
    return;
  }

  for (const row of rows) {
    if (processing.has(row.id)) continue;
    processing.add(row.id);
    try {
      const claimed = await claimOtp(row.id);
      if (!claimed) continue;
      const code = decryptOtp(row.code_encrypted);
      if (!code) throw new Error("Gagal mendekripsi kode OTP.");
      const text = renderOtpMessage(code);
      const jid = `${row.phone.replace(/\D/g, "")}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text });
      await markOtpSent(row.id);
      await addAuditLog("otp_sent", { phone: row.phone }, row.id);
      log.info({ phone: row.phone }, "OTP terkirim.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markOtpFailed(row.id, message).catch(() => undefined);
      await addAuditLog("otp_send_failed", { phone: row.phone, error: message }, row.id).catch(
        () => undefined,
      );
      log.error({ phone: row.phone, error: message }, "Gagal mengirim OTP.");
    } finally {
      processing.delete(row.id);
    }
  }
}

async function main() {
  log.info("Menjalankan Ta'awun WhatsApp worker...");
  await fs.mkdir(config.authDir, { recursive: true });
  await connect();
  setInterval(() => void heartbeat(), config.heartbeatIntervalMs);
  setInterval(() => void sendOtps(), config.otpPollIntervalMs);

  const shutdown = async (signal: string) => {
    log.info(`${signal} diterima. Menutup worker...`);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    try {
      await sock?.end(undefined);
    } catch {
      // abaikan
    }
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void main();
