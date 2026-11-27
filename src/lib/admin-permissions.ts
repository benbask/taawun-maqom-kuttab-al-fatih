/**
 * Daftar hak akses admin. Satu hak = satu menu utama di panel admin.
 * Dipakai bersama oleh middleware, navigasi, dan panel akun.
 */
export const ADMIN_PERMISSIONS = [
  "dashboard",
  "verifikasi",
  "konten",
  "kelas",
  "form",
  "alumni",
  "kehadiran",
  "qris",
  "whatsapp",
  "export",
  "audit",
  "akun",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  dashboard: "Ringkasan",
  verifikasi: "Verifikasi pembayaran",
  konten: "Konten beranda",
  kelas: "Kelas",
  form: "Formulir",
  alumni: "Alumni",
  kehadiran: "Daftar hadir ayah",
  qris: "QRIS & pengaturan",
  whatsapp: "WhatsApp & OTP",
  export: "Ekspor data",
  audit: "Audit log",
  akun: "Akun admin",
};

export const SLOT_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  code_harnes: "Code Harnes Admin",
  bendahara_1: "Bendahara 1",
  bendahara_2: "Bendahara 2",
  asisten: "Asisten (uji)",
};

export const SLOT_ORDER = [
  "super_admin",
  "code_harnes",
  "bendahara_1",
  "bendahara_2",
  "asisten",
];

export const ROLE_PRESETS: Record<string, AdminPermission[]> = {
  super_admin: [...ADMIN_PERMISSIONS],
  code_harnes: [
    "dashboard",
    "konten",
    "kelas",
    "form",
    "alumni",
    "qris",
    "whatsapp",
  ],
  bendahara_1: ["dashboard", "verifikasi", "kehadiran", "export", "akun"],
  bendahara_2: ["dashboard", "verifikasi", "kehadiran", "export", "akun"],
  asisten: [...ADMIN_PERMISSIONS],
};

export function normalizePermissions(
  input: unknown,
): AdminPermission[] | null {
  if (input === null || input === undefined) return null;
  if (!Array.isArray(input)) return null;
  const valid = new Set<string>(ADMIN_PERMISSIONS);
  const result = input.filter(
    (item): item is AdminPermission => typeof item === "string" && valid.has(item),
  );
  return [...new Set(result)];
}

export function hasPermission(
  permissions: readonly string[] | null | undefined,
  permission: AdminPermission,
) {
  // Sesi lama (sebelum ada hak akses) tetap dianggap super admin.
  if (permissions === null || permissions === undefined) return true;
  return permissions.includes(permission);
}

function permissionForPath(pathname: string): AdminPermission | null {
  const path = pathname.replace(/\/$/, "");

  const rules: Array<[RegExp, AdminPermission]> = [
    [/^\/admin\/verifikasi|^\/api\/admin\/(invoices|auto-verify)/, "verifikasi"],
    [/^\/admin\/kehadiran|^\/api\/admin\/attendance/, "kehadiran"],
    [/^\/admin\/konten|^\/api\/admin\/upload/, "konten"],
    [/^\/admin\/kelas|^\/api\/admin\/classes/, "kelas"],
    [/^\/admin\/form|^\/api\/admin\/fields/, "form"],
    [/^\/admin\/alumni/, "alumni"],
    [/^\/admin\/qris|^\/api\/admin\/settings/, "qris"],
    [/^\/admin\/whatsapp|^\/api\/admin\/wa/, "whatsapp"],
    [/^\/admin\/export|^\/api\/admin\/export/, "export"],
    [/^\/admin\/audit/, "audit"],
  ];

  for (const [pattern, permission] of rules) {
    if (pattern.test(path)) return permission;
  }
  return null;
}

/** Hak yang dibutuhkan untuk membuka suatu halaman atau endpoint admin. */
export function requiredPermission(pathname: string): AdminPermission | null {
  return permissionForPath(pathname);
}

export function isPublicAdminPath(pathname: string) {
  return (
    /^\/admin\/(login|setup|akses-ditolak)$/.test(pathname) ||
    /^\/api\/admin\/(login|setup|logout)$/.test(pathname)
  );
}
