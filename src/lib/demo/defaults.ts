import "server-only";
import crypto from "node:crypto";
import { createDemoQrisPayload } from "@/lib/qris";
import { hashPassword } from "@/lib/crypto";
import { DEMO_ADMIN_PASSWORD, DEMO_ADMIN_USERNAME } from "@/lib/env";
import type {
  Admin,
  AuditLog,
  ClassRecord,
  Family,
  FormField,
  Invoice,
  InvoiceItem,
  OtpRequest,
  Settings,
  Student,
  WaSession,
} from "@/lib/types";

export function nowIso() {
  return new Date().toISOString();
}

export function defaultSettings(): Settings {
  return {
    id: 1,
    site_name: "Ta'awun Maqom Kuttab Al Fatih Lampung",
    tagline: "Bersama membangun generasi Qur'ani",
    hero_title: "Ta'awun untuk Maqom Kuttab Al Fatih Lampung",
    hero_subtitle:
      "Setiap kontribusi Anda menjadi bagian dari perjalanan pendidikan Qur'an anak-anak kita. Mari berTa'awun dengan mudah, transparan, dan terverifikasi.",
    info_markdown: `## Kebutuhan Ta'awun

Dana Ta'awun digunakan untuk mendukung operasional pendidikan, kebutuhan santri, dan pengembangan sarana Maqom Kuttab Al Fatih Lampung.

### Rincian kebutuhan
- Operasional pembelajaran dan honor pengajar
- Perlengkapan belajar dan buku santri
- Perawatan sarana dan kebersihan
- Kegiatan pembinaan dan mabit santri

Setiap kontribusi akan dicatat, diverifikasi, dan ditampilkan pada halaman rekap. Jazakumullahu khairan.`,
    target_amount: 150_000_000,
    deadline: "2027-06-30",
    contact_whatsapp: "6281234567890",
    contact_name: "Admin Ta'awun",
    address: "Bandar Lampung, Lampung",
    logo_url: null,
    hero_image_url: null,
    qris_payload: createDemoQrisPayload(),
    qris_merchant_name: "MAQOM KUTTAB AL FATIH",
    qris_merchant_city: "BANDAR LAMPUNG",
    unique_code_base: 9,
    unique_code_max_digits: 3,
    invoice_expiry_hours: 24,
    otp_expiry_minutes: 10,
    admin_whatsapp: "6281234567890",
    otp_template:
      "Kode verifikasi Ta'awun Maqom Kuttab Al Fatih Lampung: {{kode}}. Berlaku {{menit}} menit. Jangan bagikan kode ini kepada siapa pun.",
    sheets_webhook_url: null,
    sheets_webhook_secret: null,
    footer_credit: "Beny Abu Ibrahim",
    updated_at: nowIso(),
  };
}

export function defaultClasses(): ClassRecord[] {
  const names = ["Kelas 1 A", "Kelas 1 B", "Kelas 2 A", "Kelas 2 B", "Kelas 3 A"];
  return names.map((name, index) => ({
    id: crypto.randomUUID(),
    name,
    level: name.replace("Kelas ", ""),
    sort_order: index + 1,
    is_active: true,
    created_at: nowIso(),
  }));
}

export function defaultFormFields(): FormField[] {
  return [
    {
      id: crypto.randomUUID(),
      scope: "family",
      key: "nama_ayah",
      label: "Nama Ayah",
      type: "text",
      placeholder: "Nama ayah",
      help_text: "Opsional, untuk data keluarga.",
      required: false,
      options: [],
      sort_order: 1,
      is_active: true,
      created_at: nowIso(),
    },
    {
      id: crypto.randomUUID(),
      scope: "student",
      key: "tanggal_lahir",
      label: "Tanggal Lahir Anak",
      type: "date",
      placeholder: null,
      help_text: null,
      required: false,
      options: [],
      sort_order: 1,
      is_active: true,
      created_at: nowIso(),
    },
  ];
}

export function defaultWaSession(): WaSession {
  return {
    id: 1,
    status: "disconnected",
    qr: null,
    connected_phone: null,
    last_heartbeat: null,
    last_error: null,
    logout_requested: false,
    updated_at: nowIso(),
  };
}

function svgProof(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1000" viewBox="0 0 720 1000"><rect width="720" height="1000" fill="#f8f5ee"/><rect x="40" y="40" width="640" height="920" rx="24" fill="#ffffff" stroke="#d6d3d1" stroke-width="3"/><text x="360" y="120" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#064e3b">BUKTI TRANSFER DEMO</text><text x="360" y="180" text-anchor="middle" font-family="Arial" font-size="20" fill="#57534e">${label}</text><line x1="80" y1="230" x2="640" y2="230" stroke="#e7e5e4" stroke-width="2"/><text x="80" y="290" font-family="Arial" font-size="20" fill="#44403c">Bank</text><text x="640" y="290" text-anchor="end" font-family="Arial" font-size="20" fill="#44403c">QRIS DEMO</text><text x="80" y="340" font-family="Arial" font-size="20" fill="#44403c">Penerima</text><text x="640" y="340" text-anchor="end" font-family="Arial" font-size="20" fill="#44403c">MAQOM KUTTAB AL FATIH</text><text x="80" y="390" font-family="Arial" font-size="20" fill="#44403c">Status</text><text x="640" y="390" text-anchor="end" font-family="Arial" font-size="20" fill="#047857">BERHASIL</text><line x1="80" y1="440" x2="640" y2="440" stroke="#e7e5e4" stroke-width="2"/><text x="360" y="560" text-anchor="middle" font-family="Arial" font-size="22" fill="#78716c">Dokumen ini hanya contoh tampilan.</text><text x="360" y="600" text-anchor="middle" font-family="Arial" font-size="22" fill="#78716c">Bukan bukti pembayaran sungguhan.</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function seedDemoStore() {
  const classes = defaultClasses();
  const settings = defaultSettings();
  const admin: Admin = {
    id: crypto.randomUUID(),
    username: DEMO_ADMIN_USERNAME,
    password_hash: await hashPassword(DEMO_ADMIN_PASSWORD),
    created_at: nowIso(),
    last_login_at: null,
  };

  const families: Family[] = [];
  const students: Student[] = [];
  const invoices: Invoice[] = [];
  const items: InvoiceItem[] = [];

  const date = (day: number, hour = 9) =>
    new Date(2026, 10, day, hour, 15, 0).toISOString();

  function addFamily(
    parentName: string,
    phone: string,
    children: Array<{ name: string; classIndex: number }>,
  ) {
    const family: Family = {
      id: crypto.randomUUID(),
      phone,
      parent_name: parentName,
      email: null,
      google_sub: null,
      phone_verified_at: date(1),
      custom_data: { nama_ayah: parentName },
      consent_at: date(1),
      is_demo: false,
      account_type: null,
      alumni_profile: {},
      created_at: date(1),
      updated_at: date(1),
    };
    families.push(family);
    const created = children.map((child) => {
      const student: Student = {
        id: crypto.randomUUID(),
        family_id: family.id,
        name: child.name,
        class_id: classes[child.classIndex].id,
        custom_data: {},
        created_at: date(1),
      };
      students.push(student);
      return student;
    });
    return { family, students: created };
  }

  function addInvoice(input: {
    family: Family;
    students: Student[];
    amounts: number[];
    status: Invoice["status"];
    day: number;
    uniqueCode: number;
    type?: Invoice["type"];
    classIndexes?: number[];
    label?: string;
    note?: string;
  }) {
    const base = input.amounts.reduce((total, amount) => total + amount, 0);
    const id = crypto.randomUUID();
    const invoiceNo = `TAA-2611${String(input.day).padStart(2, "0")}-${String(
      invoices.length + 1,
    ).padStart(4, "0")}`;
    const invoice: Invoice = {
      id,
      invoice_no: invoiceNo,
      family_id: input.family.id,
      type: input.type ?? "registration",
      base_amount: base,
      unique_code: input.uniqueCode,
      total_amount: base + input.uniqueCode,
      status: input.status,
      qris_payload: null,
      proof_url:
        input.status === "pending" ? null : svgProof(`${invoiceNo} • ${input.family.parent_name}`),
      proof_uploaded_at: input.status === "pending" ? null : date(input.day, 10),
      reject_reason: null,
      notes: input.note ?? null,
      expires_at: date(input.day + 1, 23),
      verified_at: input.status === "verified" ? date(input.day, 11) : null,
      verified_by: input.status === "verified" ? admin.id : null,
      is_demo: false,
      created_at: date(input.day, 8),
      updated_at: date(input.day, 11),
    };
    invoices.push(invoice);

    if (input.type === "addition" && input.label) {
      items.push({
        id: crypto.randomUUID(),
        invoice_id: id,
        student_id: input.students[0]?.id ?? null,
        class_id: input.students[0]?.class_id ?? null,
        description: input.label,
        amount: base,
        created_at: date(input.day),
      });
    } else {
      input.students.forEach((student, index) => {
        items.push({
          id: crypto.randomUUID(),
          invoice_id: id,
          student_id: student.id,
          class_id: classes[input.classIndexes?.[index] ?? 0].id,
          description: `Ta'awun ${student.name}`,
          amount: input.amounts[index],
          created_at: date(input.day),
        });
      });
    }
    return invoice;
  }

  const ahmad = addFamily("Ahmad Fauzi", "6281200000001", [
    { name: "Muhammad Fauzi", classIndex: 0 },
    { name: "Aisyah Fauzi", classIndex: 2 },
  ]);
  addInvoice({
    family: ahmad.family,
    students: ahmad.students,
    amounts: [1_500_000, 1_500_000],
    status: "verified",
    day: 1,
    uniqueCode: 9,
    classIndexes: [0, 2],
  });
  addInvoice({
    family: ahmad.family,
    students: ahmad.students,
    amounts: [500_000],
    status: "verified",
    day: 8,
    uniqueCode: 19,
    type: "addition",
    label: "Tambahan Ta'awun umum",
  });

  const siti = addFamily("Siti Rahma", "6281200000002", [
    { name: "Khalid Rahman", classIndex: 1 },
  ]);
  addInvoice({
    family: siti.family,
    students: siti.students,
    amounts: [1_500_000],
    status: "verified",
    day: 3,
    uniqueCode: 29,
    classIndexes: [1],
  });
  addInvoice({
    family: siti.family,
    students: siti.students,
    amounts: [250_000],
    status: "verified",
    day: 10,
    uniqueCode: 39,
    type: "addition",
    label: "Tambahan Ta'awun Khalid",
  });

  const budi = addFamily("Budi Santoso", "6281200000003", [
    { name: "Yusuf Santoso", classIndex: 4 },
  ]);
  addInvoice({
    family: budi.family,
    students: budi.students,
    amounts: [2_000_000],
    status: "verified",
    day: 5,
    uniqueCode: 49,
    classIndexes: [4],
  });

  const dewi = addFamily("Dewi Lestari", "6281200000004", [
    { name: "Fatimah Lestari", classIndex: 3 },
    { name: "Zaid Lestari", classIndex: 0 },
  ]);
  addInvoice({
    family: dewi.family,
    students: dewi.students,
    amounts: [1_500_000, 1_500_000],
    status: "verified",
    day: 12,
    uniqueCode: 59,
    classIndexes: [3, 0],
  });

  const rina = addFamily("Rina Marlina", "6281200000005", [
    { name: "Hamzah Marlina", classIndex: 2 },
  ]);
  addInvoice({
    family: rina.family,
    students: rina.students,
    amounts: [1_500_000],
    status: "waiting_verification",
    day: 20,
    uniqueCode: 69,
    classIndexes: [2],
  });

  const andi = addFamily("Andi Pratama", "6281200000006", [
    { name: "Bilal Pratama", classIndex: 4 },
  ]);
  addInvoice({
    family: andi.family,
    students: andi.students,
    amounts: [2_000_000],
    status: "pending",
    day: 23,
    uniqueCode: 79,
    classIndexes: [4],
  });

  const auditLogs: AuditLog[] = [
    {
      id: crypto.randomUUID(),
      actor_type: "system",
      actor_id: null,
      action: "demo_seed",
      entity_type: "settings",
      entity_id: "1",
      metadata: { note: "Data demo dibuat otomatis." },
      created_at: nowIso(),
    },
  ];

  return {
    settings,
    admins: [admin],
    classes,
    form_fields: defaultFormFields(),
    families,
    students,
    invoices,
    invoice_items: items,
    otp_requests: [] as OtpRequest[],
    wa_session: defaultWaSession(),
    audit_logs: auditLogs,
  };
}
