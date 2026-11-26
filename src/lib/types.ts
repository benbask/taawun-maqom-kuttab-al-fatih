import type { AccountRole, AlumniProfile } from "@/lib/account-roles";

export type InvoiceStatus =
  | "pending"
  | "waiting_verification"
  | "verified"
  | "rejected"
  | "expired"
  | "cancelled";

export type InvoiceType = "registration" | "addition";

export type FieldScope = "family" | "student";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "date"
  | "checkbox";

export type OtpStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "verified"
  | "expired";

export interface Settings {
  id: number;
  site_name: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  info_markdown: string;
  target_amount: number;
  deadline: string | null;
  contact_whatsapp: string;
  contact_name: string;
  address: string;
  logo_url: string | null;
  hero_image_url: string | null;
  qris_payload: string | null;
  qris_merchant_name: string | null;
  qris_merchant_city: string | null;
  unique_code_base: number;
  unique_code_max_digits: number;
  invoice_expiry_hours: number;
  otp_expiry_minutes: number;
  admin_whatsapp: string;
  otp_template: string;
  sheets_webhook_url: string | null;
  sheets_webhook_secret: string | null;
  footer_credit: string;
  share_title: string;
  share_description: string;
  share_image_url: string | null;
  updated_at: string;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  last_login_at: string | null;
}

export interface ClassRecord {
  id: string;
  name: string;
  level: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface FormField {
  id: string;
  scope: FieldScope;
  key: string;
  label: string;
  type: FieldType;
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  options: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Family {
  id: string;
  phone: string;
  parent_name: string;
  email: string | null;
  google_sub: string | null;
  phone_verified_at: string | null;
  custom_data: Record<string, unknown>;
  consent_at: string | null;
  is_demo: boolean;
  account_type: AccountRole | null;
  alumni_profile: Partial<AlumniProfile>;
  created_at: string;
  updated_at: string;
}

export interface GoogleIdentity {
  sub: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
}

export interface Student {
  id: string;
  family_id: string;
  name: string;
  class_id: string | null;
  custom_data: Record<string, unknown>;
  created_at: string;
}

export interface StudentDirectoryEntry {
  id: string;
  nis: string;
  name: string;
  class_name: string;
  level: string | null;
  sub_class: string | null;
  gender: string | null;
  father_name: string;
  mother_name: string | null;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  family_id: string;
  type: InvoiceType;
  base_amount: number;
  unique_code: number;
  total_amount: number;
  status: InvoiceStatus;
  qris_payload: string | null;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  reject_reason: string | null;
  notes: string | null;
  expires_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  student_id: string | null;
  class_id: string | null;
  description: string | null;
  amount: number;
  created_at: string;
}

export interface InvoiceItemWithDetails extends InvoiceItem {
  student: Student | null;
  class: ClassRecord | null;
}

export interface InvoiceWithDetails extends Invoice {
  family: Family;
  items: InvoiceItemWithDetails[];
}

export interface OtpRequest {
  id: string;
  phone: string;
  code_hash: string;
  code_encrypted: string;
  status: OtpStatus;
  attempts: number;
  requested_ip: string | null;
  worker_error: string | null;
  sent_at: string | null;
  verified_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface OtpRequestWithCode extends OtpRequest {
  code: string | null;
}

export interface WaSession {
  id: number;
  status: "disconnected" | "qr" | "connecting" | "connected" | "error";
  qr: string | null;
  connected_phone: string | null;
  last_heartbeat: string | null;
  last_error: string | null;
  logout_requested: boolean;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_type: "admin" | "user" | "system" | "worker";
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PublicStats {
  total: number;
  target: number;
  donorCount: number;
  studentCount: number;
  perClass: Array<{
    classId: string;
    className: string;
    total: number;
    count: number;
    zeroCount: number;
  }>;
  umumTotal: number;
  umumCount: number;
  uniqueCodeTotal: number;
  lastUpdated: string | null;
}

export interface VerificationRow {
  id: string;
  className: string;
  childName: string;
  parentName: string;
  phone: string;
  proofUploadedAt: string | null;
  amount: number;
  invoiceNo: string;
  uniqueCode: number;
  status: InvoiceStatus;
}

export interface VerificationData {
  classes: ClassRecord[];
  selectedClassId: string | null;
  selectedClassName: string | null;
  rows: VerificationRow[];
  classTotal: number;
  classCount: number;
}

export interface RegistrationChildInput {
  name: string;
  classId: string;
  amount: number;
  customData?: Record<string, unknown>;
}

export interface CreateInvoiceInput {
  familyId: string;
  type: InvoiceType;
  items: Array<{
    studentId?: string | null;
    classId?: string | null;
    description?: string | null;
    amount: number;
  }>;
}

export interface StatsBundle {
  stats: PublicStats;
  classes: ClassRecord[];
}

export interface Store {
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  getAdminCount(): Promise<number>;
  getAdminByUsername(username: string): Promise<Admin | null>;
  getAdminById(id: string): Promise<Admin | null>;
  createAdmin(username: string, passwordHash: string): Promise<Admin>;
  updateAdminLogin(id: string): Promise<void>;
  updateAdminPassword(id: string, passwordHash: string): Promise<void>;

  listClasses(activeOnly?: boolean): Promise<ClassRecord[]>;
  upsertClass(input: Partial<ClassRecord> & { name: string }): Promise<ClassRecord>;
  deleteClass(id: string): Promise<void>;

  listFormFields(activeOnly?: boolean): Promise<FormField[]>;
  upsertFormField(
    input: Partial<FormField> & { label: string; scope: FieldScope },
  ): Promise<FormField>;
  deleteFormField(id: string): Promise<void>;

  getFamilyByPhone(phone: string): Promise<Family | null>;
  getFamilyByLinkedPhone(phone: string): Promise<Family | null>;
  getFamilyById(id: string): Promise<Family | null>;
  getFamilyByGoogleSub(sub: string): Promise<Family | null>;
  linkGoogleToFamily(
    id: string,
    input: { googleSub: string; email: string | null; verifiedAt: string },
  ): Promise<Family>;
  createFamily(input: {
    phone: string;
    parentName: string;
    customData?: Record<string, unknown>;
    consentAt?: string | null;
    isDemo?: boolean;
  }): Promise<Family>;
  updateFamily(
    id: string,
    patch: Partial<
      Pick<
        Family,
        "parent_name" | "custom_data" | "account_type" | "alumni_profile"
      >
    >,
  ): Promise<Family>;
  listAlumni(): Promise<Family[]>;
  listAllFamilies(): Promise<Family[]>;
  deleteDemoData(): Promise<void>;
  listStudents(familyId: string): Promise<Student[]>;
  listStudentDirectory(): Promise<StudentDirectoryEntry[]>;
  createStudent(input: {
    familyId: string;
    name: string;
    classId: string | null;
    customData?: Record<string, unknown>;
  }): Promise<Student>;

  createInvoice(input: CreateInvoiceInput): Promise<InvoiceWithDetails>;
  getInvoiceById(id: string): Promise<InvoiceWithDetails | null>;
  listInvoicesByFamily(familyId: string): Promise<InvoiceWithDetails[]>;
  listAllInvoices(options?: { includeDemo?: boolean }): Promise<InvoiceWithDetails[]>;
  setInvoiceQris(id: string, payload: string): Promise<void>;
  setInvoiceProof(
    id: string,
    proofUrl: string,
    uploadedAt: string,
  ): Promise<void>;
  verifyInvoice(
    id: string,
    status: "verified" | "rejected" | "cancelled" | "pending" | "waiting_verification",
    adminId: string,
    reason?: string | null,
  ): Promise<void>;

  createOtp(input: {
    phone: string;
    codeHash: string;
    codeEncrypted: string;
    expiresAt: string;
    requestedIp?: string | null;
  }): Promise<OtpRequest>;
  getOtpById(id: string): Promise<OtpRequest | null>;
  getLatestOtp(phone: string): Promise<OtpRequest | null>;
  listOtpRequests(limit?: number): Promise<OtpRequest[]>;
  markOtpSent(id: string, status: "sent" | "failed", error?: string | null): Promise<void>;
  markOtpVerified(id: string): Promise<void>;
  incrementOtpAttempts(id: string): Promise<number>;

  getWaSession(): Promise<WaSession>;
  requestWorkerLogout(): Promise<void>;
  resetWaSession(): Promise<void>;

  getPublicStats(options?: { includeDemo?: boolean }): Promise<PublicStats>;
  getVerificationData(classId?: string | null): Promise<VerificationData>;

  listAuditLogs(limit?: number): Promise<AuditLog[]>;
  addAuditLog(input: {
    actorType: AuditLog["actor_type"];
    actorId?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;

  uploadProof(input: {
    invoiceId: string;
    file: File;
  }): Promise<{ path: string; url: string }>;
  getProofResponse(invoiceId: string): Promise<Response | null>;
  uploadPublicImage(input: {
    file: File;
    folder?: string;
  }): Promise<{ url: string }>;
}
