import { z } from "zod";

const phoneInput = z
  .string()
  .trim()
  .min(4, "Nomor WhatsApp terlalu pendek.")
  .max(24, "Nomor WhatsApp terlalu panjang.");

export const otpRequestSchema = z.object({
  phone: phoneInput,
});

export const simpleLoginSchema = z.object({
  phone: phoneInput,
  password: z
    .string()
    .trim()
    .refine((value) => value === "Bismillah", "Sandi tidak benar."),
});

export const otpVerifySchema = z.object({
  phone: phoneInput,
  code: z.string().regex(/^\d{4}$/, "Kode harus 4 digit."),
});

export const registrationChildSchema = z.object({
  name: z.string().trim().min(1, "Nama anak wajib diisi.").max(100),
  classId: z.string().uuid("Kelas tidak valid."),
  amount: z.coerce
    .number()
    .int("Nominal harus bilangan bulat.")
    .min(1000, "Nominal minimal Rp 1.000.")
    .max(100_000_000, "Nominal terlalu besar."),
  customData: z.record(z.string(), z.unknown()).optional(),
});

export const registrationSchema = z.object({
  parentName: z.string().trim().min(2, "Nama wali minimal 2 karakter.").max(100),
  children: z
    .array(registrationChildSchema)
    .min(1, "Minimal satu anak.")
    .max(10, "Maksimal 10 anak."),
  customData: z.record(z.string(), z.unknown()).optional(),
});

export const studentCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama santri wajib diisi.").max(100),
  classId: z.string().uuid("Kelas tidak valid."),
});

export const additionSchema = z.object({
  studentId: z.string().uuid().nullable().optional(),
  classId: z.string().uuid().nullable().optional(),
  amount: z.coerce
    .number()
    .int("Nominal harus bilangan bulat.")
    .min(1000, "Nominal minimal Rp 1.000.")
    .max(100_000_000, "Nominal terlalu besar."),
  note: z.string().trim().max(300).optional(),
  linkFamilyId: z.string().uuid().nullable().optional(),
});

export const googleTokenSchema = z.object({
  credential: z.string().min(16, "Token Google tidak valid.").max(16_384),
});

export const googleBindSchema = z.object({
  confirm: z.boolean().refine((value) => value, {
    message: "Konfirmasi pengikatan akun diperlukan.",
  }),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(8).max(200),
});

export const adminSetupSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(8, "Password minimal 8 karakter.").max(200),
});

export const settingsSchema = z
  .object({
    site_name: z.string().trim().min(3).max(120).nullable(),
    tagline: z.string().trim().max(200).nullable(),
    hero_title: z.string().trim().min(3).max(160).nullable(),
    hero_subtitle: z.string().trim().max(300).nullable(),
    info_markdown: z.string().max(20000).nullable(),
    target_amount: z.coerce.number().int().min(0).max(100_000_000_000),
    deadline: z.string().nullable(),
    contact_whatsapp: z.string().trim().max(30).nullable(),
    contact_name: z.string().trim().max(100).nullable(),
    address: z.string().trim().max(300).nullable(),
    logo_url: z.string().nullable(),
    hero_image_url: z.string().nullable(),
    qris_payload: z.string().nullable(),
    qris_merchant_name: z.string().nullable(),
    qris_merchant_city: z.string().nullable(),
    unique_code_base: z.coerce.number().int().min(1).max(999),
    invoice_expiry_hours: z.coerce.number().int().min(1).max(168),
    otp_expiry_minutes: z.coerce.number().int().min(2).max(30),
    admin_whatsapp: z.string().trim().max(30).nullable(),
    otp_template: z.string().max(1000).nullable(),
    sheets_webhook_url: z.string().nullable(),
    sheets_webhook_secret: z.string().nullable(),
    footer_credit: z.string().max(200).nullable(),
  })
  .partial();

export const classSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Nama kelas wajib.").max(80),
  level: z.string().trim().max(50).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
});

export const formFieldSchema = z.object({
  id: z.string().uuid().optional(),
  scope: z.enum(["family", "student"]),
  label: z.string().trim().min(1, "Label wajib.").max(80),
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, "Key hanya huruf kecil, angka, dan underscore.")
    .max(50)
    .optional(),
  type: z.enum(["text", "textarea", "number", "select", "date", "checkbox"]),
  placeholder: z.string().trim().max(120).nullable().optional(),
  help_text: z.string().trim().max(200).nullable().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
});

export const verifyInvoiceSchema = z.object({
  status: z.enum(["verified", "rejected", "cancelled"]),
  reason: z.string().trim().max(500).nullable().optional(),
});

export const sheetsExportSchema = z.object({
  webhookUrl: z.string().url().optional(),
  secret: z.string().optional(),
});
