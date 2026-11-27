import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { seedDemoStore } from "@/lib/demo/defaults";
import { maskName } from "@/lib/format";
import { toDynamicQris } from "@/lib/qris";
import { findUniqueCode } from "@/lib/unique-code";
import { UPLOAD_MAX_BYTES } from "@/lib/env";
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
  StudentDirectoryEntry,
  VerificationData,
  WaSession,
} from "@/lib/types";

interface DemoDb {
  settings: Settings;
  admins: Admin[];
  classes: ClassRecord[];
  form_fields: FormField[];
  families: Family[];
  students: Student[];
  invoices: Invoice[];
  invoice_items: import("@/lib/types").InvoiceItem[];
  otp_requests: OtpRequest[];
  wa_session: WaSession;
  audit_logs: AuditLog[];
}

const dataFile =
  process.env.DEMO_DATA_FILE ??
  path.join(process.cwd(), ".data", "demo.json");

let queue: Promise<unknown> = Promise.resolve();

async function loadDb(): Promise<DemoDb> {
  try {
    const text = await fs.readFile(/* turbopackIgnore: true */ dataFile, "utf8");
    return JSON.parse(text) as DemoDb;
  } catch {
    const seeded = await seedDemoStore();
    await saveDb(seeded);
    return seeded;
  }
}

async function saveDb(db: DemoDb) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  const temp = `${dataFile}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(temp, dataFile);
}

function withDb<T>(operation: (db: DemoDb) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const db = await loadDb();
    const result = await operation(db);
    await saveDb(db);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function now() {
  return new Date().toISOString();
}

function invoiceNo(db: DemoDb) {
  const date = new Date();
  const yymmdd = `${String(date.getFullYear()).slice(2)}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  let sequence = db.invoices.length + 1;
  let candidate = `TAA-${yymmdd}-${String(sequence).padStart(4, "0")}`;
  while (db.invoices.some((invoice) => invoice.invoice_no === candidate)) {
    sequence += 1;
    candidate = `TAA-${yymmdd}-${String(sequence).padStart(4, "0")}`;
  }
  return candidate;
}

function hydrate(db: DemoDb, invoice: Invoice): InvoiceWithDetails {
  const family = db.families.find((item) => item.id === invoice.family_id);
  if (!family) {
    throw new Error("Data keluarga untuk invoice tidak ditemukan.");
  }
  const items = db.invoice_items
    .filter((item) => item.invoice_id === invoice.id)
    .map((item) => ({
      ...item,
      student: db.students.find((student) => student.id === item.student_id) ?? null,
      class: db.classes.find((cls) => cls.id === item.class_id) ?? null,
    }));

  let qrisPayload = invoice.qris_payload;
  if (!qrisPayload && db.settings.qris_payload) {
    try {
      qrisPayload = toDynamicQris(db.settings.qris_payload, {
        amount: invoice.total_amount,
        invoiceNo: invoice.invoice_no,
      });
    } catch {
      qrisPayload = null;
    }
  }

  return { ...invoice, qris_payload: qrisPayload, family, items };
}

export const demoStore: Store = {
  async getSettings() {
    return withDb((db) => ({ ...db.settings }));
  },

  async updateSettings(patch) {
    return withDb((db) => {
      db.settings = { ...db.settings, ...patch, id: 1, updated_at: now() };
      return { ...db.settings };
    });
  },

  async getAdminCount() {
    return withDb((db) => db.admins.length);
  },

  async getAdminByUsername(username) {
    return withDb(
      (db) =>
        db.admins.find(
          (admin) => admin.username.toLowerCase() === username.toLowerCase(),
        ) ?? null,
    );
  },

  async getAdminById(id) {
    return withDb((db) => db.admins.find((admin) => admin.id === id) ?? null);
  },

  async createAdmin(username, passwordHash) {
    return withDb((db) => {
      if (db.admins.some((admin) => admin.username.toLowerCase() === username.toLowerCase())) {
        throw new Error("Username sudah dipakai.");
      }
      const admin: Admin = {
        id: crypto.randomUUID(),
        username,
        password_hash: passwordHash,
        created_at: now(),
        last_login_at: null,
      };
      db.admins.push(admin);
      return admin;
    });
  },

  async updateAdminLogin(id) {
    return withDb((db) => {
      const admin = db.admins.find((item) => item.id === id);
      if (admin) admin.last_login_at = now();
    });
  },

  async updateAdminPassword(id, passwordHash) {
    return withDb((db) => {
      const admin = db.admins.find((item) => item.id === id);
      if (admin) admin.password_hash = passwordHash;
    });
  },

  async listClasses(activeOnly = false) {
    return withDb((db) =>
      db.classes
        .filter((item) => !activeOnly || item.is_active)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        .map((item) => ({ ...item })),
    );
  },

  async upsertClass(input) {
    return withDb((db) => {
      if (input.id) {
        const existing = db.classes.find((item) => item.id === input.id);
        if (!existing) throw new Error("Kelas tidak ditemukan.");
        Object.assign(existing, {
          name: input.name,
          level: input.level ?? existing.level,
          sort_order: input.sort_order ?? existing.sort_order,
          is_active: input.is_active ?? existing.is_active,
        });
        return { ...existing };
      }
      const created: ClassRecord = {
        id: crypto.randomUUID(),
        name: input.name,
        level: input.level ?? null,
        sort_order:
          input.sort_order ??
          (db.classes.length
            ? Math.max(...db.classes.map((item) => item.sort_order)) + 1
            : 1),
        is_active: input.is_active ?? true,
        created_at: now(),
      };
      db.classes.push(created);
      return { ...created };
    });
  },

  async deleteClass(id) {
    return withDb((db) => {
      const existing = db.classes.find((item) => item.id === id);
      if (existing) existing.is_active = false;
    });
  },

  async listFormFields(activeOnly = false) {
    return withDb((db) =>
      db.form_fields
        .filter((item) => !activeOnly || item.is_active)
        .sort((a, b) => a.scope.localeCompare(b.scope) || a.sort_order - b.sort_order)
        .map((item) => ({ ...item })),
    );
  },

  async upsertFormField(input) {
    return withDb((db) => {
      const slug = input.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 50);
      const key = input.key || slug || `field_${Date.now()}`;

      if (input.id) {
        const existing = db.form_fields.find((item) => item.id === input.id);
        if (!existing) throw new Error("Field tidak ditemukan.");
        Object.assign(existing, {
          scope: input.scope,
          key,
          label: input.label,
          type: input.type ?? existing.type,
          placeholder: input.placeholder ?? null,
          help_text: input.help_text ?? null,
          required: input.required ?? existing.required,
          options: input.options ?? existing.options,
          sort_order: input.sort_order ?? existing.sort_order,
          is_active: input.is_active ?? existing.is_active,
        });
        return { ...existing };
      }

      let finalKey = key;
      let counter = 2;
      while (db.form_fields.some((item) => item.scope === input.scope && item.key === finalKey)) {
        finalKey = `${key}_${counter}`;
        counter += 1;
      }

      const created: FormField = {
        id: crypto.randomUUID(),
        scope: input.scope,
        key: finalKey,
        label: input.label,
        type: input.type ?? "text",
        placeholder: input.placeholder ?? null,
        help_text: input.help_text ?? null,
        required: input.required ?? false,
        options: input.options ?? [],
        sort_order:
          input.sort_order ??
          (db.form_fields.length
            ? Math.max(...db.form_fields.map((item) => item.sort_order)) + 1
            : 1),
        is_active: input.is_active ?? true,
        created_at: now(),
      };
      db.form_fields.push(created);
      return { ...created };
    });
  },

  async deleteFormField(id) {
    return withDb((db) => {
      const existing = db.form_fields.find((item) => item.id === id);
      if (existing) existing.is_active = false;
    });
  },

  async getFamilyByPhone(phone) {
    return withDb((db) => db.families.find((item) => item.phone === phone) ?? null);
  },

  async getFamilyByLinkedPhone(phone) {
    return withDb(
      (db) =>
        db.families.find((item) => {
          const phones = (item.custom_data as { linked_phones?: unknown })?.linked_phones;
          return Array.isArray(phones) && phones.includes(phone);
        }) ?? null,
    );
  },

  async getFamilyById(id) {
    return withDb((db) => db.families.find((item) => item.id === id) ?? null);
  },

  async getFamilyByGoogleSub(sub) {
    return withDb((db) => db.families.find((item) => item.google_sub === sub) ?? null);
  },

  async linkGoogleToFamily(id, input) {
    return withDb((db) => {
      const conflict = db.families.find(
        (item) => item.google_sub === input.googleSub && item.id !== id,
      );
      if (conflict) throw new Error("Akun Google ini sudah terhubung dengan keluarga lain.");
      const family = db.families.find((item) => item.id === id);
      if (!family) throw new Error("Keluarga tidak ditemukan.");
      family.google_sub = input.googleSub;
      family.email = input.email;
      family.phone_verified_at = input.verifiedAt;
      family.updated_at = now();
      return { ...family };
    });
  },

  async createFamily(input) {
    return withDb((db) => {
      const existing = db.families.find((item) => item.phone === input.phone);
      if (existing) return { ...existing };
      const family: Family = {
        id: crypto.randomUUID(),
        phone: input.phone,
        parent_name: input.parentName,
        email: null,
        google_sub: null,
        phone_verified_at: null,
        custom_data: input.customData ?? {},
        consent_at: input.consentAt ?? now(),
        is_demo: input.isDemo ?? false,
        account_type: null,
        alumni_profile: {},
        created_at: now(),
        updated_at: now(),
      };
      db.families.push(family);
      return { ...family };
    });
  },

  async updateFamily(id, patch) {
    return withDb((db) => {
      const family = db.families.find((item) => item.id === id);
      if (!family) throw new Error("Keluarga tidak ditemukan.");
      if (patch.parent_name !== undefined) family.parent_name = patch.parent_name;
      if (patch.custom_data !== undefined) family.custom_data = patch.custom_data;
      if (patch.account_type !== undefined) family.account_type = patch.account_type;
      if (patch.alumni_profile !== undefined) family.alumni_profile = patch.alumni_profile;
      family.updated_at = now();
      return { ...family };
    });
  },

  async listAlumni() {
    return withDb((db) =>
      db.families
        .filter((item) => item.account_type === "alumni_join")
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((item) => ({ ...item })),
    );
  },

  async listAllFamilies(): Promise<Family[]> {
    return withDb((db) =>
      [...db.families]
        .sort((a, b) => a.parent_name.localeCompare(b.parent_name))
        .map((family) => ({ ...family })),
    );
  },

  async deleteDemoData() {
    return withDb((db) => {
      const familyIds = new Set(
        db.families.filter((family) => family.is_demo).map((family) => family.id),
      );
      const invoiceIds = new Set(
        db.invoices
          .filter(
            (invoice) => invoice.is_demo || familyIds.has(invoice.family_id),
          )
          .map((invoice) => invoice.id),
      );
      db.invoice_items = db.invoice_items.filter(
        (item) => !invoiceIds.has(item.invoice_id),
      );
      db.invoices = db.invoices.filter((invoice) => !invoiceIds.has(invoice.id));
      db.students = db.students.filter(
        (student) => !familyIds.has(student.family_id),
      );
      db.families = db.families.filter((family) => !familyIds.has(family.id));
    });
  },

  async listStudents(familyId) {
    return withDb((db) =>
      db.students
        .filter((item) => item.family_id === familyId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((item) => ({ ...item })),
    );
  },

  async listStudentDirectory(): Promise<StudentDirectoryEntry[]> {
    return [];
  },

  async createStudent(input) {
    return withDb((db) => {
      const student: Student = {
        id: crypto.randomUUID(),
        family_id: input.familyId,
        name: input.name,
        class_id: input.classId,
        custom_data: input.customData ?? {},
        created_at: now(),
      };
      db.students.push(student);
      return { ...student };
    });
  },

  async createInvoice(input: CreateInvoiceInput) {
    return withDb((db) => {
      if (!db.families.some((family) => family.id === input.familyId)) {
        throw new Error("Keluarga tidak ditemukan.");
      }
      if (!input.items.length) throw new Error("Invoice tanpa rincian.");
      const baseAmount = input.items.reduce((total, item) => total + item.amount, 0);
      if (baseAmount <= 0) throw new Error("Nominal invoice tidak valid.");

      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const usedTotals = db.invoices
        .filter(
          (invoice) =>
            ["pending", "waiting_verification"].includes(invoice.status) ||
            (invoice.status === "verified" &&
              new Date(invoice.created_at).getTime() >= cutoff),
        )
        .map((invoice) => invoice.total_amount);

      const uniqueCode = findUniqueCode({
        baseAmount,
        baseCode: db.settings.unique_code_base,
        maxDigits: db.settings.unique_code_max_digits,
        usedTotals,
      });

      const id = crypto.randomUUID();
      const no = invoiceNo(db);
      const totalAmount = baseAmount + uniqueCode;
      const expiresAt = new Date(
        Date.now() + db.settings.invoice_expiry_hours * 60 * 60 * 1000,
      ).toISOString();

      let qrisPayload: string | null = null;
      if (db.settings.qris_payload) {
        try {
          qrisPayload = toDynamicQris(db.settings.qris_payload, {
            amount: totalAmount,
            invoiceNo: no,
          });
        } catch {
          qrisPayload = null;
        }
      }

      const invoice: Invoice = {
        id,
        invoice_no: no,
        family_id: input.familyId,
        type: input.type,
        base_amount: baseAmount,
        unique_code: uniqueCode,
        total_amount: totalAmount,
        status: "pending",
        qris_payload: qrisPayload,
        proof_url: null,
        proof_uploaded_at: null,
        reject_reason: null,
        notes: null,
        expires_at: expiresAt,
        verified_at: null,
        verified_by: null,
        auto_verify_status: null,
        auto_verify_amount: null,
        auto_verify_at: null,
        is_demo:
          db.families.find((family) => family.id === input.familyId)?.is_demo ?? false,
        created_at: now(),
        updated_at: now(),
      };
      db.invoices.push(invoice);

      for (const item of input.items) {
        const student = item.studentId
          ? db.students.find((entry) => entry.id === item.studentId)
          : null;
        db.invoice_items.push({
          id: crypto.randomUUID(),
          invoice_id: id,
          student_id: item.studentId ?? null,
          class_id: item.classId ?? student?.class_id ?? null,
          description: item.description ?? null,
          amount: item.amount,
          created_at: now(),
        });
      }

      return hydrate(db, invoice);
    });
  },

  async getInvoiceById(id) {
    return withDb((db) => {
      const invoice = db.invoices.find((item) => item.id === id);
      return invoice ? hydrate(db, invoice) : null;
    });
  },

  async listInvoicesByFamily(familyId) {
    return withDb((db) =>
      db.invoices
        .filter((invoice) => invoice.family_id === familyId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((invoice) => hydrate(db, invoice)),
    );
  },

  async listAllInvoices(options?: { includeDemo?: boolean }) {
    return withDb((db) =>
      [...db.invoices]
        .filter((invoice) => options?.includeDemo || !invoice.is_demo)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((invoice) => hydrate(db, invoice)),
    );
  },

  async setInvoiceQris(id, payload) {
    return withDb((db) => {
      const invoice = db.invoices.find((item) => item.id === id);
      if (invoice) {
        invoice.qris_payload = payload;
        invoice.updated_at = now();
      }
    });
  },

  async setInvoiceProof(id, proofUrl, uploadedAt) {
    return withDb((db) => {
      const invoice = db.invoices.find((item) => item.id === id);
      if (!invoice) throw new Error("Invoice tidak ditemukan.");
      invoice.proof_url = proofUrl;
      invoice.proof_uploaded_at = uploadedAt;
      invoice.status = "waiting_verification";
      invoice.updated_at = now();
    });
  },

  async verifyInvoice(id, status, adminId, reason) {
    return withDb((db) => {
      const invoice = db.invoices.find((item) => item.id === id);
      if (!invoice) throw new Error("Invoice tidak ditemukan.");
      invoice.status = status;
      invoice.reject_reason = status === "rejected" ? reason ?? null : null;
      invoice.verified_at = status === "verified" ? now() : null;
      invoice.verified_by = status === "verified" ? adminId : null;
      invoice.updated_at = now();
    });
  },

  async setAutoVerifyResult(id, result) {
    return withDb((db) => {
      const invoice = db.invoices.find((item) => item.id === id);
      if (!invoice) throw new Error("Invoice tidak ditemukan.");
      invoice.auto_verify_status = result.status;
      invoice.auto_verify_amount = result.amount;
      invoice.auto_verify_at = result.at;
      invoice.updated_at = result.at;
    });
  },

  async createOtp(input) {
    return withDb((db) => {
      for (const otp of db.otp_requests) {
        if (
          otp.phone === input.phone &&
          ["pending", "sending", "sent"].includes(otp.status)
        ) {
          otp.status = "expired";
        }
      }
      const otp: OtpRequest = {
        id: crypto.randomUUID(),
        phone: input.phone,
        code_hash: input.codeHash,
        code_encrypted: input.codeEncrypted,
        status: "pending",
        attempts: 0,
        requested_ip: input.requestedIp ?? null,
        worker_error: null,
        sent_at: null,
        verified_at: null,
        expires_at: input.expiresAt,
        created_at: now(),
      };
      db.otp_requests.push(otp);
      return { ...otp };
    });
  },

  async getOtpById(id) {
    return withDb((db) => db.otp_requests.find((item) => item.id === id) ?? null);
  },

  async getLatestOtp(phone) {
    return withDb(
      (db) =>
        db.otp_requests
          .filter((item) => item.phone === phone)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null,
    );
  },

  async listOtpRequests(limit = 50) {
    return withDb((db) =>
      [...db.otp_requests]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit)
        .map((item) => ({ ...item })),
    );
  },

  async markOtpSent(id, status, error) {
    return withDb((db) => {
      const otp = db.otp_requests.find((item) => item.id === id);
      if (!otp) return;
      otp.status = status;
      otp.worker_error = error ?? null;
      otp.sent_at = status === "sent" ? now() : otp.sent_at;
    });
  },

  async markOtpVerified(id) {
    return withDb((db) => {
      const otp = db.otp_requests.find((item) => item.id === id);
      if (!otp) return;
      otp.status = "verified";
      otp.verified_at = now();
    });
  },

  async incrementOtpAttempts(id) {
    return withDb((db) => {
      const otp = db.otp_requests.find((item) => item.id === id);
      if (!otp) return 0;
      otp.attempts += 1;
      return otp.attempts;
    });
  },

  async getWaSession() {
    return withDb((db) => ({ ...db.wa_session }));
  },

  async requestWorkerLogout() {
    return withDb((db) => {
      db.wa_session.logout_requested = true;
      db.wa_session.updated_at = now();
    });
  },

  async resetWaSession() {
    return withDb((db) => {
      db.wa_session = {
        ...db.wa_session,
        status: "disconnected",
        qr: null,
        connected_phone: null,
        last_error: null,
        logout_requested: false,
        updated_at: now(),
      };
    });
  },

  async getPublicStats(options?: { includeDemo?: boolean }): Promise<PublicStats> {
    return withDb((db) => {
      const included = db.invoices.filter(
        (invoice) =>
          (invoice.status === "verified" ||
            (invoice.status === "waiting_verification" &&
              invoice.proof_uploaded_at)) &&
          (options?.includeDemo || !invoice.is_demo),
      );
      const donorIds = new Set(included.map((invoice) => invoice.family_id));
      const studentIds = new Set<string>();
      const contributorAmounts = new Map<string, { name: string; amount: number }>();
      const billedByFamily = new Map<string, Set<string>>();
      const perClassMap = new Map<
        string,
        { total: number; count: number; zeroCount: number }
      >();
      let umumTotal = 0;
      let umumCount = 0;
      let uniqueCodeTotal = 0;
      let lastUpdated: string | null = null;

      for (const invoice of included) {
        const family = db.families.find((item) => item.id === invoice.family_id);
        const familyName = family?.parent_name ?? "Ayah";
        const contributor = contributorAmounts.get(invoice.family_id) ?? {
          name: familyName,
          amount: 0,
        };
        contributor.amount += invoice.base_amount;
        contributorAmounts.set(invoice.family_id, contributor);
        uniqueCodeTotal += invoice.unique_code;
        if (
          invoice.proof_uploaded_at &&
          (!lastUpdated || invoice.proof_uploaded_at > lastUpdated)
        ) {
          lastUpdated = invoice.proof_uploaded_at;
        }
        const items = db.invoice_items.filter((item) => item.invoice_id === invoice.id);
        if (!items.length) {
          umumTotal += invoice.base_amount;
          umumCount += 1;
          continue;
        }
        for (const item of items) {
          if (item.student_id) studentIds.add(item.student_id);
          if (item.class_id) {
            const billed =
              billedByFamily.get(invoice.family_id) ?? new Set<string>();
            billed.add(item.class_id);
            billedByFamily.set(invoice.family_id, billed);
            const current = perClassMap.get(item.class_id) ?? {
              total: 0,
              count: 0,
              zeroCount: 0,
            };
            current.total += item.amount;
            current.count += 1;
            perClassMap.set(item.class_id, current);
          } else {
            umumTotal += item.amount;
            umumCount += 1;
          }
        }
      }

      // Saudara kandung di kelas lain ikut dihitung dengan nominal 0.
      const countedZero = new Set<string>();
      for (const student of db.students.filter((item) => donorIds.has(item.family_id))) {
        if (!student.class_id) continue;
        studentIds.add(student.id);
        if (billedByFamily.get(student.family_id)?.has(student.class_id)) continue;

        const key = `${student.family_id}:${student.class_id}`;
        if (countedZero.has(key)) continue;
        countedZero.add(key);

        const current = perClassMap.get(student.class_id) ?? {
          total: 0,
          count: 0,
          zeroCount: 0,
        };
        current.count += 1;
        current.zeroCount += 1;
        perClassMap.set(student.class_id, current);
      }

      const perClass = db.classes
        .filter((cls) => perClassMap.has(cls.id))
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((cls) => ({
          classId: cls.id,
          className: cls.name,
          total: perClassMap.get(cls.id)?.total ?? 0,
          count: perClassMap.get(cls.id)?.count ?? 0,
          zeroCount: perClassMap.get(cls.id)?.zeroCount ?? 0,
        }));

      return {
        total: included.reduce((total, invoice) => total + invoice.total_amount, 0),
        target: db.settings.target_amount,
        donorCount: donorIds.size,
        studentCount: studentIds.size,
        perClass,
        umumTotal,
        umumCount,
        uniqueCodeTotal,
        lastUpdated,
        topContributors: [...contributorAmounts.entries()]
          .map(([id, value]) => ({
            id,
            name: maskName(value.name),
            amount: value.amount,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10),
      };
    });
  },

  async getVerificationData(classId): Promise<VerificationData> {
    return withDb((db) => {
      const classes = db.classes
        .filter((cls) => cls.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);
      const selectedClassId =
        classId && classes.some((cls) => cls.id === classId)
          ? classId
          : classes[0]?.id ?? null;
      const selectedClassName =
        classes.find((cls) => cls.id === selectedClassId)?.name ?? null;

      const rows = db.invoices
        .filter(
          (invoice) =>
            invoice.status === "verified" ||
            (invoice.status === "waiting_verification" && invoice.proof_uploaded_at),
        )
        .flatMap((invoice) => {
          const family = db.families.find((item) => item.id === invoice.family_id);
          const items = db.invoice_items.filter(
            (item) => item.invoice_id === invoice.id && item.class_id === selectedClassId,
          );
          return items.map((item) => {
            const student = db.students.find((entry) => entry.id === item.student_id);
            return {
              id: item.id,
              className: selectedClassName ?? "-",
              childName: student?.name ?? item.description ?? "Santri",
              parentName: family?.parent_name ?? "-",
              phone: family?.phone ?? "",
              proofUploadedAt: invoice.proof_uploaded_at,
              amount: item.amount,
              invoiceNo: invoice.invoice_no,
              uniqueCode: invoice.unique_code,
              status: invoice.status,
            };
          });
        })
        .sort((a, b) =>
          (b.proofUploadedAt ?? "").localeCompare(a.proofUploadedAt ?? ""),
        );

      return {
        classes,
        selectedClassId,
        selectedClassName,
        rows,
        classTotal: rows.reduce((total, row) => total + row.amount, 0),
        classCount: rows.length,
      };
    });
  },

  async listAuditLogs(limit = 100) {
    return withDb((db) =>
      [...db.audit_logs]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit)
        .map((item) => ({ ...item })),
    );
  },

  async addAuditLog(input) {
    return withDb((db) => {
      db.audit_logs.push({
        id: crypto.randomUUID(),
        actor_type: input.actorType,
        actor_id: input.actorId ?? null,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ?? {},
        created_at: now(),
      });
      db.audit_logs = db.audit_logs.slice(-1000);
    });
  },

  async uploadProof({ invoiceId, file }) {
    if (file.size > UPLOAD_MAX_BYTES) {
      throw new Error("Ukuran bukti transfer terlalu besar.");
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      throw new Error("Format bukti harus JPG, PNG, WEBP, atau PDF.");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    return { path: `demo:${invoiceId}`, url: dataUrl };
  },

  async uploadPublicImage({ file }) {
    if (file.size > UPLOAD_MAX_BYTES) {
      throw new Error("Ukuran gambar terlalu besar.");
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      throw new Error("Format gambar harus JPG, PNG, atau WEBP.");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    return { url: `data:${file.type};base64,${buffer.toString("base64")}` };
  },

  async getProofResponse(invoiceId) {
    return withDb((db) => {
      const invoice = db.invoices.find((item) => item.id === invoiceId);
      if (!invoice?.proof_url?.startsWith("data:")) return null;
      const match = invoice.proof_url.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return null;
      const buffer = Buffer.from(match[2], "base64");
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": match[1],
          "Cache-Control": "private, max-age=60",
          "Content-Disposition": "inline",
        },
      });
    });
  },

  async downloadProof(invoiceId) {
    return withDb((db) => {
      const invoice = db.invoices.find((item) => item.id === invoiceId);
      const match = invoice?.proof_url?.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Bukti transfer tidak tersedia.");
      return {
        bytes: new Uint8Array(Buffer.from(match[2], "base64")),
        type: match[1],
      };
    });
  },
};
