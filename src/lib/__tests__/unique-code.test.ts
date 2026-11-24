import { describe, expect, it } from "vitest";
import { findUniqueCode, uniqueCodePattern } from "@/lib/unique-code";

describe("kode unik", () => {
  it("mengikuti pola 9, 19, 29", () => {
    expect(uniqueCodePattern(9, 3, 4)).toEqual([9, 19, 29, 39]);
    expect(
      findUniqueCode({ baseAmount: 300_000, baseCode: 9, usedTotals: [] }),
    ).toBe(9);
  });

  it("melewati nominal yang bentrok", () => {
    expect(
      findUniqueCode({
        baseAmount: 300_000,
        baseCode: 9,
        usedTotals: [300_009, 300_019],
      }),
    ).toBe(29);
  });

  it("melewati kode yang sudah terpakai", () => {
    expect(
      findUniqueCode({
        baseAmount: 300_000,
        baseCode: 9,
        usedCodes: [9, 19],
      }),
    ).toBe(29);
  });

  it("tetap maksimal 3 digit", () => {
    const code = findUniqueCode({ baseAmount: 100_000, baseCode: 999 });
    expect(code).toBe(999);
  });
});
