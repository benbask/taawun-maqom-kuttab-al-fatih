import "server-only";
import { normalizePhone } from "@/lib/format";
import { getStore } from "@/lib/store";

/**
 * Mode demo publik.
 *
 * Nomor demo: 08888 (dinormalisasi menjadi 628888)
 * Kode OTP demo: 8888 (tetap, tanpa WhatsApp)
 *
 * Semua data yang dibuat oleh nomor ini ditandai `is_demo` sehingga
 * tidak pernah muncul di rekap publik, verifikasi admin, maupun export.
 */
export const DEMO_PHONE = "628888";
export const DEMO_CODE = "8888";
export const DEMO_PARENT_NAME = "Keluarga Demo";
export const DEMO_CHILDREN = ["Ahmad Demo", "Aisyah Demo"] as const;
export const DEMO_AMOUNT = 100_000;

const DEMO_DIGITS = new Set(["8888", "08888", "628888"]);

export function isDemoInput(input: string) {
  return DEMO_DIGITS.has(input.replace(/\D/g, ""));
}

export function isDemoPhone(phone: string | null | undefined) {
  return phone === DEMO_PHONE;
}

/** Mengubah input nomor menjadi nomor tersimpan; mengenali nomor demo. */
export function resolvePhone(input: string): string | null {
  if (isDemoInput(input)) return DEMO_PHONE;
  return normalizePhone(input);
}

/**
 * Memastikan keluarga demo beserta contoh santri dan satu tagihan sudah ada.
 * Dipanggil saat login demo pertama kali.
 */
export async function ensureDemoData() {
  const store = getStore();

  let family = await store.getFamilyByPhone(DEMO_PHONE);
  if (!family) {
    family = await store.createFamily({
      phone: DEMO_PHONE,
      parentName: DEMO_PARENT_NAME,
      consentAt: new Date().toISOString(),
      isDemo: true,
    });
  }

  const students = await store.listStudents(family.id);
  if (students.length > 0) return family;

  const classes = await store.listClasses(true);
  const picked = classes.slice(0, 2);
  const created = [];

  for (const [index, name] of DEMO_CHILDREN.entries()) {
    const classRecord = picked[index] ?? picked[0] ?? null;
    created.push(
      await store.createStudent({
        familyId: family.id,
        name,
        classId: classRecord?.id ?? null,
      }),
    );
  }

  const first = created[0];
  if (first) {
    await store.createInvoice({
      familyId: family.id,
      type: "registration",
      items: [
        {
          studentId: first.id,
          classId: first.class_id,
          description: "Ta'awun demo",
          amount: DEMO_AMOUNT,
        },
      ],
    });
  }

  return family;
}
