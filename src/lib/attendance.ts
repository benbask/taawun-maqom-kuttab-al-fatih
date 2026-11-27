import type { Family, OtsSummary, StudentDirectoryEntry } from "@/lib/types";

export type AttendanceStatus = "hadir" | "tidak" | "belum";

export interface AttendanceRow {
  fatherName: string;
  children: string[];
  classes: string[];
  status: AttendanceStatus;
  familyId: string | null;
  phone: string | null;
  updatedAt: string | null;
}

export const attendanceLabels: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  tidak: "Tidak hadir",
  belum: "Belum pilih",
};

export function normalizeFather(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function attendanceStatus(role: Family["account_type"]): AttendanceStatus {
  if (role === "ots" || role === "alumni_join") return "hadir";
  if (role === "outsider" || role === "alumni") return "tidak";
  return "belum";
}

export function buildAttendance(
  entries: StudentDirectoryEntry[],
  families: Family[],
): AttendanceRow[] {
  const byFather = new Map<
    string,
    { fatherName: string; children: string[]; classes: Set<string> }
  >();

  for (const entry of entries) {
    const key = normalizeFather(entry.father_name);
    if (!key) continue;
    const group =
      byFather.get(key) ??
      { fatherName: entry.father_name.trim(), children: [], classes: new Set<string>() };
    group.children.push(entry.name.trim());
    if (entry.class_name) group.classes.add(entry.class_name.trim());
    byFather.set(key, group);
  }

  const familyByFather = new Map<string, Family>();
  for (const family of families) {
    const key = normalizeFather(family.parent_name);
    if (key && !familyByFather.has(key)) familyByFather.set(key, family);
  }

  return Array.from(byFather.entries())
    .map(([key, group]) => {
      const family = familyByFather.get(key) ?? null;
      return {
        fatherName: group.fatherName,
        children: group.children.sort((a, b) => a.localeCompare(b)),
        classes: Array.from(group.classes).sort((a, b) => a.localeCompare(b)),
        status: family ? attendanceStatus(family.account_type) : ("belum" as AttendanceStatus),
        familyId: family?.id ?? null,
        phone: family?.phone ?? null,
        updatedAt: family?.updated_at ?? null,
      };
    })
    .sort((a, b) => a.fatherName.localeCompare(b.fatherName));
}

/**
 * Ringkasan keikutsertaan OTS untuk rekap publik. Satu ayah unik dalam
 * daftar santri dihitung sebagai satu keluarga OTS.
 */
export function buildOtsSummary(
  entries: StudentDirectoryEntry[],
  families: Family[],
  donorFamilyIds: Iterable<string>,
): OtsSummary {
  const rows = buildAttendance(entries, families);
  const donors = new Set(donorFamilyIds);

  return {
    total: rows.length,
    terdaftar: rows.filter((row) => Boolean(row.familyId)).length,
    hadir: rows.filter((row) => row.status === "hadir").length,
    tidak: rows.filter((row) => row.status === "tidak").length,
    belumDaftar: rows.filter((row) => row.status === "belum").length,
    bertaawun: rows.filter(
      (row) => Boolean(row.familyId) && donors.has(row.familyId as string),
    ).length,
  };
}
