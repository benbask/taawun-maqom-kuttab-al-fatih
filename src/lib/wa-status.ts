import "server-only";
import type { WaSession } from "@/lib/types";

/** Worker dianggap aktif jika terhubung dan heartbeat lebih baru dari 2 menit. */
export function isWaWorkerOnline(session: WaSession, now = Date.now()) {
  if (session.status !== "connected" || !session.last_heartbeat) return false;
  const heartbeat = Date.parse(session.last_heartbeat);
  if (Number.isNaN(heartbeat)) return false;
  return now - heartbeat < 2 * 60 * 1000;
}
