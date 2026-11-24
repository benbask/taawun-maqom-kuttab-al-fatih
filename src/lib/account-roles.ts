import { z } from "zod";

export const ACCOUNT_ROLE_VALUES = [
  "outsider",
  "alumni",
  "alumni_join",
  "ots",
] as const;

export type AccountRole = (typeof ACCOUNT_ROLE_VALUES)[number];

export function isAccountRole(value: unknown): value is AccountRole {
  return typeof value === "string" && ACCOUNT_ROLE_VALUES.includes(value as AccountRole);
}

export const roleLabels: Record<AccountRole, string> = {
  outsider: "Donatur umum",
  alumni: "Alumni (ta'awun saja)",
  alumni_join: "OTS Alumni",
  ots: "OTS Aktif",
};

export function roleDestination(role: AccountRole): string {
  if (role === "ots") return "/daftar";
  if (role === "alumni_join") return "/alumni";
  return "/tambah";
}

export const alumniProfileSchema = z.object({
  nama: z.string().trim().min(2, "Nama alumni minimal 2 karakter.").max(100),
  angkatan: z.string().trim().min(2, "Angkatan wajib diisi.").max(30),
  whatsapp: z.string().trim().max(30).nullable().optional(),
  kota: z.string().trim().max(100).nullable().optional(),
  catatan: z.string().trim().max(500).nullable().optional(),
});

export type AlumniProfile = z.infer<typeof alumniProfileSchema>;

export const accountRoleSchema = z.object({
  role: z.enum(ACCOUNT_ROLE_VALUES),
  profile: alumniProfileSchema.optional(),
});
