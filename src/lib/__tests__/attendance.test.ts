import { describe, expect, it } from "vitest";
import { buildOtsSummary } from "@/lib/attendance";
import type { Family, StudentDirectoryEntry } from "@/lib/types";

function entry(father: string, child: string): StudentDirectoryEntry {
  return {
    id: `${father}-${child}`,
    nis: `${father}-${child}`,
    name: child,
    class_name: "1A",
    level: null,
    sub_class: null,
    gender: null,
    father_name: father,
    mother_name: null,
  };
}

function family(
  id: string,
  parentName: string,
  accountType: Family["account_type"],
): Family {
  return {
    id,
    parent_name: parentName,
    account_type: accountType,
  } as Family;
}

describe("ringkasan OTS publik", () => {
  it("menghitung ayah unik dari daftar santri", () => {
    const entries = [
      entry("Ahmad", "Ani"),
      entry("Ahmad", "Budi"),
      entry("Budi", "Sari"),
      entry("Joko", "Rani"),
    ];
    const families = [
      family("f1", "Ahmad", "ots"),
      family("f2", "Budi", "alumni"),
    ];
    const summary = buildOtsSummary(entries, families, ["f1"]);

    expect(summary).toEqual({
      total: 3,
      terdaftar: 2,
      hadir: 1,
      tidak: 1,
      belumDaftar: 1,
      bertaawun: 1,
    });
  });

  it("menghitung alumni yang ikut Maqom sebagai hadir", () => {
    const entries = [entry("Ahmad", "Ani"), entry("Joko", "Rani")];
    const families = [family("f1", "Ahmad", "alumni_join")];
    const summary = buildOtsSummary(entries, families, ["f1"]);

    expect(summary.hadir).toBe(1);
    expect(summary.bertaawun).toBe(1);
    expect(summary.belumDaftar).toBe(1);
  });
});
