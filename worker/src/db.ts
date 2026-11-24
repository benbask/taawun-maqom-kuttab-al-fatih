import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export const supabase: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export interface WaSessionRow {
  id: number;
  status: string;
  qr: string | null;
  connected_phone: string | null;
  last_heartbeat: string | null;
  last_error: string | null;
  logout_requested: boolean;
  updated_at: string;
}

export interface OtpRow {
  id: string;
  phone: string;
  code_hash: string;
  code_encrypted: string;
  status: string;
  attempts: number;
  sent_at: string | null;
  expires_at: string;
  created_at: string;
}

export async function getWaSession(): Promise<WaSessionRow> {
  const { data, error } = await supabase
    .from("wa_session")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Baris wa_session id=1 tidak ditemukan. Jalankan migrasi 0001_init.sql.");
  return data as WaSessionRow;
}

export async function updateWaSession(patch: Partial<WaSessionRow>) {
  const { error } = await supabase
    .from("wa_session")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

export async function addAuditLog(
  action: string,
  metadata: Record<string, unknown> = {},
  entityId: string | null = null,
) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_type: "worker",
    actor_id: null,
    action,
    entity_type: "otp",
    entity_id: entityId,
    metadata,
  });
  if (error) console.warn("[worker] gagal menulis audit:", error.message);
}

export async function claimOtp(id: string) {
  const { data, error } = await supabase
    .from("otp_requests")
    .update({ status: "sending", worker_error: null })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function markOtpSent(id: string) {
  const { error } = await supabase
    .from("otp_requests")
    .update({ status: "sent", sent_at: new Date().toISOString(), worker_error: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markOtpFailed(id: string, message: string) {
  const { error } = await supabase
    .from("otp_requests")
    .update({ status: "failed", worker_error: message.slice(0, 500) })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listPendingOtps(): Promise<OtpRow[]> {
  const { data, error } = await supabase
    .from("otp_requests")
    .select("*")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as OtpRow[];
}
