import { describe, expect, it } from "vitest";
import {
  createDemoQrisPayload,
  crc16ccitt,
  parseTlv,
  toDynamicQris,
  validateQris,
} from "@/lib/qris";

describe("QRIS", () => {
  it("membuat payload demo yang valid", () => {
    const payload = createDemoQrisPayload();
    const validation = validateQris(payload);
    expect(validation.valid).toBe(true);
    expect(validation.merchantName).toBe("MAQOM KUTTAB AL FATIH");
    expect(validation.isStatic).toBe(true);
    expect(payload.slice(-4)).toBe(crc16ccitt(payload.slice(0, -4)));
  });

  it("mengubah QRIS statis menjadi dinamis dengan nominal dan bill number", () => {
    const staticPayload = createDemoQrisPayload();
    const dynamic = toDynamicQris(staticPayload, {
      amount: 1_500_009,
      invoiceNo: "TAA-261124-0001",
    });
    const validation = validateQris(dynamic);
    expect(validation.valid).toBe(true);
    expect(validation.isStatic).toBe(false);
    expect(validation.amount).toBe(1_500_009);

    const tags = parseTlv(dynamic);
    expect(tags.find((tag) => tag.tag === "01")?.value).toBe("12");
    expect(tags.find((tag) => tag.tag === "54")?.value).toBe("1500009");
    const bill = tags.find((tag) => tag.tag === "62");
    expect(bill).toBeTruthy();
    expect(bill?.value).toContain("TAA-261124-0001");
    expect(dynamic.slice(-4)).toBe(crc16ccitt(dynamic.slice(0, -4)));
  });

  it("menolak payload dengan checksum salah", () => {
    const payload = createDemoQrisPayload();
    const tampered = `${payload.slice(0, -4)}0000`;
    const validation = validateQris(tampered);
    expect(validation.valid).toBe(false);
  });
});
