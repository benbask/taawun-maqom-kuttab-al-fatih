import "server-only";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl, UPLOAD_MAX_BYTES } from "@/lib/env";
import { defaultSettings } from "@/lib/demo/defaults";
import { toDynamicQris } from "@/lib/qris";
import { NoUniqueCodeError } from "@/lib/unique-code";
import type {
  Admin,
  AuditLog,
  ClassRecord,
  CreateInvoiceInput,
  Family,
  FormField,
  Invoice,
  InvoiceWithDetails,
  OtpRequest,
  PublicStats,
  Settings,
  Store,
  Student,
  VerificationData,
  WaSession,
} from "@/lib/types";

let cached: SupabaseClient | null = null;

function db() {
  if (!cached) {
    cached = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

function must<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function num(value: unknown) {
  return Number(value ?? 0);
}

function mapSettings(row: Record<string, unknown>): Settings {
  return {
    ...(row as unknown as Settings),
    target_amount: num(row.target_amount),
    unique_code_base: num(row.unique_code_base),
    unique_code_max_digits: num(row.unique_code_max_digits),
    invoice_expiry_hours: num(row.invoice_expiry_hours),
    otp_expiry_minutes: num(row.otp_expiry_minutes),
  };
}

function mapInvoice(row: Record<string, unknown>): InvoiceWithDetails {
  const family = (row.family ?? row.families) as Family;
  const rawItems = (row.items ?? row.invoice_items ?? []) as Array<Record<string, unknown>>;
  const items = rawItems.map((item) => ({
    ...(item as unknown as import("@/lib/types").InvoiceItem),
    amount: num(item.amount),
    student: (item.student ?? item.students ?? null) as Student | null,
    class: (item.class ?? item.classes ?? null) as ClassRecord | null,
  }));
  return {
    ...(row as unknown as Invoice),
    base_amount: num(row.base_amount),
    unique_code: num(row.unique_code),
    total_amount: num(row.total_amount),
    family,
    items,
  };
}

function mapOtp(row: Record<string, unknown>): OtpRequest {
  return {
    ...(row as unknown as OtpRequest),
    attempts: num(row.attempts),
  };
}

async function ensureSettings() {
  const { data, error } = await db().from("settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return mapSettings(data);

  const fallback = {
    ...defaultSettings(),
    qris_payload: null,
    qris_merchant_name: null,
    qris_merchant_city: null,
    target_amount: 0,
    contact_whatsapp: "",
    admin_whatsapp: "",
    info_markdown:
      "## Kebutuhan Ta'awun\n\nSilakan ubah informasi ini melalui halaman admin.",
  };
  const inserted = must(
    await db().from("settings").upsert(fallback, { onConflict: "id" }).select("*").single(),
  );
  return mapSettings(inserted);
}

async function ensureQris(invoice: InvoiceWithDetails) {
  if (invoice.qris_payload) return invoice;
  const settings = await ensureSettings();
  if (!settings.qris_payload) return invoice;
  try {
    const payload = toDynamicQris(settings.qris_payload, {
      amount: invoice.total_amount,
      invoiceNo: invoice.invoice_no,
    });
    await db()
      .from("invoices")
      .update({ qris_payload: payload, updated_at: new Date().toISOString() })
      .eq("id", invoice.id);
    return { ...invoice, qris_payload: payload };
  } catch (error) {
    console.error(
      "[qris] gagal membuat QRIS dinamis untuk invoice",
      invoice.id,
      error instanceof Error ? error.message : error,
    );
    return invoice;
  }
}

async function fetchInvoice(id: string) {
  const { data, error } = await db()
    .from("invoices")
    .select(
      "*, family:families(*), items:invoice_items(*, student:students(*), class:classes(*))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapInvoice(data) : null;
}

async function maxSortOrder(table: "classes" | "form_fields", scope?: string) {
  let query = db().from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  if (scope) query = query.eq("scope", scope);
  const { data } = await query;
  return num(data?.[0]?.sort_order) + 1;
}

export const supabaseStore: Store = {
  async getSettings() {
    return ensureSettings();
  },

  async updateSettings(patch) {
    const updated = must(
      await db()
        .from("settings")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", 1)
        .select("*")
        .single(),
    );
    return mapSettings(updated);
  },

  async getAdminCount() {
    const { count, error } = await db()
      .from("admins")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async getAdminByUsername(username) {
    const { data, error } = await db()
      .from("admins")
      .select("*")
      .ilike("username", username)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Admin | null) ?? null;
  },

  async getAdminById(id) {
    const { data, error } = await db().from("admins").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Admin | null) ?? null;
  },

  async createAdmin(username, passwordHash) {
    const data = must(
      await db()
        .from("admins")
        .insert({ username, password_hash: passwordHash })
        .select("*")
        .single(),
    );
    return data as Admin;
  },

  async updateAdminLogin(id) {
    const { error } = await db()
      .from("admins")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async updateAdminPassword(id, passwordHash) {
    const { error } = await db()
      .from("admins")
      .update({ password_hash: passwordHash })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listClasses(activeOnly = false) {
    let query = db().from("classes").select("*").order("sort_order").order("name");
    if (activeOnly) query = query.eq("is_active", true);
    const data = must(await query);
    return (data ?? []) as ClassRecord[];
  },

  async upsertClass(input) {
    if (input.id) {
      const data = must(
        await db()
          .from("classes")
          .update({
            name: input.name,
            level: input.level ?? null,
            sort_order: input.sort_order,
            is_active: input.is_active,
          })
          .eq("id", input.id)
          .select("*")
          .single(),
      );
      return data as ClassRecord;
    }
    const sortOrder = input.sort_order ?? (await maxSortOrder("classes"));
    const data = must(
      await db()
        .from("classes")
        .insert({
          name: input.name,
          level: input.level ?? null,
          sort_order: sortOrder,
          is_active: input.is_active ?? true,
        })
        .select("*")
        .single(),
    );
    return data as ClassRecord;
  },

  async deleteClass(id) {
    const { error } = await db().from("classes").update({ is_active: false }).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listFormFields(activeOnly = false) {
    let query = db().from("form_fields").select("*").order("scope").order("sort_order");
    if (activeOnly) query = query.eq("is_active", true);
    const data = must(await query);
    return (data ?? []) as FormField[];
  },

  async upsertFormField(input) {
    const slug = input.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50);
    const key = input.key || slug || `field_${Date.now()}`;

    if (input.id) {
      const data = must(
        await db()
          .from("form_fields")
          .update({
            scope: input.scope,
            key,
            label: input.label,
            type: input.type ?? "text",
            placeholder: input.placeholder ?? null,
            help_text: input.help_text ?? null,
            required: input.required ?? false,
            options: input.options ?? [],
            sort_order: input.sort_order,
            is_active: input.is_active ?? true,
          })
          .eq("id", input.id)
          .select("*")
          .single(),
      );
      return data as FormField;
    }

    let finalKey = key;
    let counter = 2;
    while (true) {
      const { data: existing } = await db()
        .from("form_fields")
        .select("id")
        .eq("scope", input.scope)
        .eq("key", finalKey)
        .maybeSingle();
      if (!existing) break;
      finalKey = `${key}_${counter}`;
      counter += 1;
    }

    const sortOrder = input.sort_order ?? (await maxSortOrder("form_fields", input.scope));
    const data = must(
      await db()
        .from("form_fields")
        .insert({
          scope: input.scope,
          key: finalKey,
          label: input.label,
          type: input.type ?? "text",
          placeholder: input.placeholder ?? null,
          help_text: input.help_text ?? null,
          required: input.required ?? false,
          options: input.options ?? [],
          sort_order: sortOrder,
          is_active: input.is_active ?? true,
        })
        .select("*")
        .single(),
    );
    return data as FormField;
  },

  async deleteFormField(id) {
    const { error } = await db().from("form_fields").update({ is_active: false }).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async getFamilyByPhone(phone) {
    const { data, error } = await db()
      .from("families")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Family | null) ?? null;
  },

  async getFamilyById(id) {
    const { data, error } = await db().from("families").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Family | null) ?? null;
  },

  async getFamilyByGoogleSub(sub) {
    const { data, error } = await db()
      .from("families")
      .select("*")
      .eq("google_sub", sub)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Family | null) ?? null;
  },

  async linkGoogleToFamily(id, input) {
    const conflict = await this.getFamilyByGoogleSub(input.googleSub);
    if (conflict && conflict.id !== id) {
      throw new Error("Akun Google ini sudah terhubung dengan keluarga lain.");
    }
    const data = must(
      await db()
        .from("families")
        .update({
          google_sub: input.googleSub,
          email: input.email,
          phone_verified_at: input.verifiedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single(),
    );
    return data as Family;
  },

  async createFamily(input) {
    const existing = await this.getFamilyByPhone(input.phone);
    if (existing) return existing;
    const data = must(
      await db()
        .from("families")
        .insert({
          phone: input.phone,
          parent_name: input.parentName,
          custom_data: input.customData ?? {},
          consent_at: input.consentAt ?? new Date().toISOString(),
          is_demo: input.isDemo ?? false,
        })
        .select("*")
        .single(),
    );
    return data as Family;
  },

  async updateFamily(id, patch) {
    const data = must(
      await db()
        .from("families")
        .update({
          ...(patch.parent_name !== undefined ? { parent_name: patch.parent_name } : {}),
          ...(patch.custom_data !== undefined ? { custom_data: patch.custom_data } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single(),
    );
    return data as Family;
  },

  async listStudents(familyId) {
    const data = must(
      await db()
        .from("students")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at"),
    );
    return (data ?? []) as Student[];
  },

  async createStudent(input) {
    const data = must(
      await db()
        .from("students")
        .insert({
          family_id: input.familyId,
          name: input.name,
          class_id: input.classId,
          custom_data: input.customData ?? {},
        })
        .select("*")
        .single(),
    );
    return data as Student;
  },

  async createInvoice(input: CreateInvoiceInput) {
    const settings = await ensureSettings();
    const items = input.items.map((item) => ({
      studentId: item.studentId ?? null,
      classId: item.classId ?? null,
      description: item.description ?? null,
      amount: item.amount,
    }));

    const { data, error } = await db().rpc("create_invoice", {
      p_family_id: input.familyId,
      p_type: input.type,
      p_items: items,
      p_base_code: settings.unique_code_base,
      p_expiry_hours: settings.invoice_expiry_hours,
    });
    if (error) {
      if (error.message.includes("NO_UNIQUE_CODE")) throw new NoUniqueCodeError();
      throw new Error(error.message);
    }

    const invoice = await fetchInvoice((data as Invoice).id);
    if (!invoice) throw new Error("Invoice gagal dibuat.");
    const withQris = await ensureQris(invoice);

    // Tagihan milik keluarga demo tidak boleh masuk rekap/verifikasi publik.
    if (withQris.family?.is_demo) {
      const { error: demoError } = await db()
        .from("invoices")
        .update({ is_demo: true })
        .eq("id", withQris.id);
      if (demoError) throw new Error(demoError.message);
      return { ...withQris, is_demo: true };
    }
    return withQris;
  },

  async getInvoiceById(id) {
    const invoice = await fetchInvoice(id);
    return invoice ? ensureQris(invoice) : null;
  },

  async listInvoicesByFamily(familyId) {
    const data = must(
      await db()
        .from("invoices")
        .select(
          "*, family:families(*), items:invoice_items(*, student:students(*), class:classes(*))",
        )
        .eq("family_id", familyId)
        .order("created_at", { ascending: false }),
    );
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapInvoice);
  },

  async listAllInvoices() {
    const data = must(
      await db()
        .from("invoices")
        .select(
          "*, family:families(*), items:invoice_items(*, student:students(*), class:classes(*))",
        )
        .eq("is_demo", false)
        .order("created_at", { ascending: false }),
    );
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapInvoice);
  },

  async setInvoiceQris(id, payload) {
    const { error } = await db()
      .from("invoices")
      .update({ qris_payload: payload, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async setInvoiceProof(id, proofUrl, uploadedAt) {
    const { error } = await db()
      .from("invoices")
      .update({
        proof_url: proofUrl,
        proof_uploaded_at: uploadedAt,
        status: "waiting_verification",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async verifyInvoice(id, status, adminId, reason) {
    const patch: Record<string, unknown> = {
      status,
      reject_reason: status === "rejected" ? reason ?? null : null,
      verified_at: status === "verified" ? new Date().toISOString() : null,
      verified_by: status === "verified" ? adminId : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await db().from("invoices").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async createOtp(input) {
    await db()
      .from("otp_requests")
      .update({ status: "expired" })
      .eq("phone", input.phone)
      .in("status", ["pending", "sending", "sent"]);

    const data = must(
      await db()
        .from("otp_requests")
        .insert({
          phone: input.phone,
          code_hash: input.codeHash,
          code_encrypted: input.codeEncrypted,
          expires_at: input.expiresAt,
          requested_ip: input.requestedIp ?? null,
        })
        .select("*")
        .single(),
    );
    return mapOtp(data);
  },

  async getOtpById(id) {
    const { data, error } = await db()
      .from("otp_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapOtp(data) : null;
  },

  async getLatestOtp(phone) {
    const { data, error } = await db()
      .from("otp_requests")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapOtp(data) : null;
  },

  async listOtpRequests(limit = 50) {
    const data = must(
      await db()
        .from("otp_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit),
    );
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapOtp);
  },

  async markOtpSent(id, status, error) {
    const { error: dbError } = await db()
      .from("otp_requests")
      .update({
        status,
        worker_error: error ?? null,
        sent_at: status === "sent" ? new Date().toISOString() : undefined,
      })
      .eq("id", id);
    if (dbError) throw new Error(dbError.message);
  },

  async markOtpVerified(id) {
    const { error } = await db()
      .from("otp_requests")
      .update({ status: "verified", verified_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async incrementOtpAttempts(id) {
    const otp = await this.getOtpById(id);
    if (!otp) return 0;
    const attempts = otp.attempts + 1;
    const { error } = await db()
      .from("otp_requests")
      .update({ attempts })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return attempts;
  },

  async getWaSession() {
    const { data, error } = await db()
      .from("wa_session")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as WaSession;
    const inserted = must(
      await db()
        .from("wa_session")
        .insert({ id: 1, status: "disconnected" })
        .select("*")
        .single(),
    );
    return inserted as WaSession;
  },

  async requestWorkerLogout() {
    const { error } = await db()
      .from("wa_session")
      .update({ logout_requested: true, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
  },

  async resetWaSession() {
    const { error } = await db()
      .from("wa_session")
      .update({
        status: "disconnected",
        qr: null,
        connected_phone: null,
        last_error: null,
        logout_requested: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw new Error(error.message);
  },

  async getPublicStats(): Promise<PublicStats> {
    const settings = await ensureSettings();
    const invoices = must(
      await db()
        .from("invoices")
        .select(
          "id, family_id, base_amount, unique_code, total_amount, proof_uploaded_at, invoice_items(amount, student_id, class_id)",
        )
        .in("status", ["verified", "waiting_verification"])
        .not("proof_uploaded_at", "is", null)
        .eq("is_demo", false),
    ) as Array<Record<string, unknown>>;
    const classes = must(
      await db().from("classes").select("*").order("sort_order"),
    ) as ClassRecord[];

    const donorIds = new Set<string>();
    const studentIds = new Set<string>();
    const perClassMap = new Map<string, { total: number; count: number }>();
    let umumTotal = 0;
    let umumCount = 0;
    let uniqueCodeTotal = 0;
    let lastUpdated: string | null = null;
    let total = 0;

    for (const invoice of invoices) {
      donorIds.add(String(invoice.family_id));
      total += num(invoice.total_amount);
      uniqueCodeTotal += num(invoice.unique_code);
      if (
        invoice.proof_uploaded_at &&
        (!lastUpdated || String(invoice.proof_uploaded_at) > lastUpdated)
      ) {
        lastUpdated = String(invoice.proof_uploaded_at);
      }
      const items = (invoice.invoice_items ?? []) as Array<Record<string, unknown>>;
      if (!items.length) {
        umumTotal += num(invoice.base_amount);
        umumCount += 1;
        continue;
      }
      for (const item of items) {
        if (item.student_id) studentIds.add(String(item.student_id));
        const classId = item.class_id ? String(item.class_id) : null;
        if (classId) {
          const current = perClassMap.get(classId) ?? { total: 0, count: 0 };
          current.total += num(item.amount);
          current.count += 1;
          perClassMap.set(classId, current);
        } else {
          umumTotal += num(item.amount);
          umumCount += 1;
        }
      }
    }

    return {
      total,
      target: settings.target_amount,
      donorCount: donorIds.size,
      studentCount: studentIds.size,
      perClass: classes
        .filter((cls) => perClassMap.has(cls.id))
        .map((cls) => ({
          classId: cls.id,
          className: cls.name,
          total: perClassMap.get(cls.id)?.total ?? 0,
          count: perClassMap.get(cls.id)?.count ?? 0,
        })),
      umumTotal,
      umumCount,
      uniqueCodeTotal,
      lastUpdated,
    };
  },

  async getVerificationData(classId): Promise<VerificationData> {
    const classes = must(
      await db()
        .from("classes")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
    ) as ClassRecord[];
    const selectedClassId =
      classId && classes.some((cls) => cls.id === classId) ? classId : classes[0]?.id ?? null;
    const selectedClassName = classes.find((cls) => cls.id === selectedClassId)?.name ?? null;

    if (!selectedClassId) {
      return {
        classes,
        selectedClassId: null,
        selectedClassName: null,
        rows: [],
        classTotal: 0,
        classCount: 0,
      };
    }

    const invoices = must(
      await db()
        .from("invoices")
        .select(
          "invoice_no, status, unique_code, proof_uploaded_at, families(parent_name, phone), invoice_items(amount, class_id, description, students(name))",
        )
        .in("status", ["verified", "waiting_verification"])
        .not("proof_uploaded_at", "is", null)
        .eq("is_demo", false)
        .eq("invoice_items.class_id", selectedClassId),
    ) as Array<Record<string, unknown>>;

    const rows = invoices
      .flatMap((invoice) => {
        const family = (invoice.families ?? {}) as Record<string, unknown>;
        const items = (invoice.invoice_items ?? []) as Array<Record<string, unknown>>;
        return items
          .filter((item) => String(item.class_id) === selectedClassId)
          .map((item) => {
            const student = (item.students ?? null) as Record<string, unknown> | null;
            return {
              id: String(item.id ?? crypto.randomUUID()),
              className: selectedClassName ?? "-",
              childName: String(student?.name ?? item.description ?? "Santri"),
              parentName: String(family.parent_name ?? "-"),
              phone: String(family.phone ?? ""),
              proofUploadedAt: invoice.proof_uploaded_at
                ? String(invoice.proof_uploaded_at)
                : null,
              amount: num(item.amount),
              invoiceNo: String(invoice.invoice_no ?? ""),
              uniqueCode: num(invoice.unique_code),
              status: invoice.status as Invoice["status"],
            };
          });
      })
      .sort((a, b) => (b.proofUploadedAt ?? "").localeCompare(a.proofUploadedAt ?? ""));

    return {
      classes,
      selectedClassId,
      selectedClassName,
      rows,
      classTotal: rows.reduce((value, row) => value + row.amount, 0),
      classCount: rows.length,
    };
  },

  async listAuditLogs(limit = 100) {
    const data = must(
      await db()
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit),
    );
    return (data ?? []) as AuditLog[];
  },

  async addAuditLog(input) {
    const { error } = await db().from("audit_logs").insert({
      actor_type: input.actorType,
      actor_id: input.actorId ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) throw new Error(error.message);
  },

  async uploadProof({ invoiceId, file }) {
    if (file.size > UPLOAD_MAX_BYTES) {
      throw new Error("Ukuran bukti transfer terlalu besar.");
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      throw new Error("Format bukti harus JPG, PNG, WEBP, atau PDF.");
    }
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
    const path = `${invoiceId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await db()
      .storage.from("proofs")
      .upload(path, new Uint8Array(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });
    if (error) throw new Error(error.message);
    return { path, url: path };
  },

  async getProofResponse(invoiceId) {
    const invoice = await fetchInvoice(invoiceId);
    if (!invoice?.proof_url) return null;
    if (invoice.proof_url.startsWith("data:")) {
      const match = invoice.proof_url.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return null;
      return new Response(new Uint8Array(Buffer.from(match[2], "base64")), {
        headers: { "Content-Type": match[1], "Cache-Control": "private, max-age=60" },
      });
    }
    const { data, error } = await db()
      .storage.from("proofs")
      .createSignedUrl(invoice.proof_url, 300);
    if (error || !data?.signedUrl) return null;
    return Response.redirect(data.signedUrl, 302);
  },
};
