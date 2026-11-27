import { describe, expect, it } from "vitest";
import {
  evaluateAutoVerify,
  extractAmounts,
} from "@/lib/auto-verify-core";

describe("verifikasi otomatis bukti transfer", () => {
  it("membaca nominal berformat Rupiah", () => {
    const text = "Total Transfer\nRp 1.500.009\n26 Nov 2026";
    expect(extractAmounts(text)).toContain(1_500_009);
  });

  it("mencocokkan nominal transfer Persis", () => {
    const result = evaluateAutoVerify({
      text: "Bukti transfer\nTotal Rp 1.500.009\nBerhasil",
      confidence: 88,
      expectedAmount: 1_500_009,
    });
    expect(result.status).toBe("matched");
    expect(result.amount).toBe(1_500_009);
  });

  it("menandai untuk admin bila nominal tidak cocok", () => {
    const result = evaluateAutoVerify({
      text: "Total Rp 1.500.000",
      confidence: 88,
      expectedAmount: 1_500_009,
    });
    expect(result.status).toBe("needs_review");
    expect(result.amount).toBe(1_500_000);
  });

  it("menandai untuk admin bila keyakinan OCR rendah", () => {
    const result = evaluateAutoVerify({
      text: "Total Rp 1.500.009",
      confidence: 42,
      expectedAmount: 1_500_009,
    });
    expect(result.status).toBe("needs_review");
  });
});
