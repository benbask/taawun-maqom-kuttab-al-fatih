export interface QrisTag {
  tag: string;
  value: string;
}

export class QrisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QrisError";
  }
}

export function parseTlv(payload: string): QrisTag[] {
  const tags: QrisTag[] = [];
  let cursor = 0;

  while (cursor < payload.length) {
    if (cursor + 4 > payload.length) {
      throw new QrisError("Struktur QRIS tidak lengkap.");
    }
    const tag = payload.slice(cursor, cursor + 2);
    const lengthText = payload.slice(cursor + 2, cursor + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lengthText)) {
      throw new QrisError("Tag QRIS tidak valid.");
    }
    const length = Number(lengthText);
    const valueStart = cursor + 4;
    const valueEnd = valueStart + length;
    if (valueEnd > payload.length) {
      throw new QrisError("Panjang nilai QRIS tidak sesuai.");
    }
    tags.push({ tag, value: payload.slice(valueStart, valueEnd) });
    cursor = valueEnd;
  }

  return tags;
}

export function buildTlv(tags: QrisTag[]): string {
  return tags
    .map(({ tag, value }) => {
      if (!/^\d{2}$/.test(tag)) throw new QrisError("Tag QRIS harus 2 digit.");
      const length = String(value.length).padStart(2, "0");
      if (value.length > 99) throw new QrisError("Nilai QRIS terlalu panjang.");
      return `${tag}${length}${value}`;
    })
    .join("");
}

/** CRC16-CCITT-FALSE, the checksum used by EMVCo QRIS. */
export function crc16ccitt(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let crc = 0xffff;

  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface QrisValidation {
  valid: boolean;
  error: string | null;
  merchantName: string | null;
  merchantCity: string | null;
  isStatic: boolean;
  amount: number | null;
  tags: QrisTag[];
}

export function validateQris(payload: string): QrisValidation {
  const empty: QrisValidation = {
    valid: false,
    error: null,
    merchantName: null,
    merchantCity: null,
    isStatic: true,
    amount: null,
    tags: [],
  };

  try {
    if (!payload || payload.length < 20) {
      return { ...empty, error: "Payload QRIS kosong atau terlalu pendek." };
    }

    const tags = parseTlv(payload);
    const last = tags[tags.length - 1];
    if (!last || last.tag !== "63" || last.value.length !== 4) {
      return { ...empty, error: "Tag checksum QRIS (63) tidak ditemukan." };
    }

    const crcBase = payload.slice(0, -4);
    const expected = crc16ccitt(crcBase);
    if (expected !== last.value.toUpperCase()) {
      return {
        ...empty,
        tags,
        error: `Checksum QRIS tidak cocok (${last.value} vs ${expected}).`,
      };
    }

    const get = (tag: string) => tags.find((item) => item.tag === tag)?.value ?? null;
    const version = get("00");
    const initiation = get("01");
    const currency = get("53");
    const country = get("58");
    const merchantName = get("59");
    const merchantCity = get("60");
    const amountValue = get("54");

    if (version !== "01") {
      return { ...empty, tags, error: "Versi QRIS tidak dikenali." };
    }
    if (!initiation || !["11", "12"].includes(initiation)) {
      return { ...empty, tags, error: "Tipe QRIS tidak valid." };
    }
    if (currency !== "360") {
      return { ...empty, tags, error: "Mata uang QRIS harus IDR (360)." };
    }
    if (country !== "ID") {
      return { ...empty, tags, error: "Negara QRIS harus ID." };
    }
    if (!merchantName) {
      return { ...empty, tags, error: "Nama merchant QRIS tidak ditemukan." };
    }

    const amount = amountValue ? Number(amountValue.replace(/\D/g, "")) : null;
    return {
      valid: true,
      error: null,
      merchantName,
      merchantCity,
      isStatic: initiation === "11",
      amount: Number.isFinite(amount) && amount ? amount : null,
      tags,
    };
  } catch (error) {
    return {
      ...empty,
      error: error instanceof Error ? error.message : "QRIS tidak valid.",
    };
  }
}

export interface DynamicQrisOptions {
  amount: number;
  invoiceNo: string;
}

export function toDynamicQris(staticPayload: string, options: DynamicQrisOptions): string {
  const validation = validateQris(staticPayload);
  if (!validation.valid) {
    throw new QrisError(validation.error ?? "QRIS statis tidak valid.");
  }
  if (!Number.isInteger(options.amount) || options.amount <= 0) {
    throw new QrisError("Nominal QRIS harus bilangan bulat positif.");
  }
  if (String(options.amount).length > 13) {
    throw new QrisError("Nominal QRIS terlalu besar.");
  }

  const tags = validation.tags.filter((tag) => !["01", "54", "63"].includes(tag.tag));

  // Tag 01 (metode inisiasi) harus langsung setelah tag 00, seperti konverter QRIS.
  const pfi = tags.findIndex((tag) => tag.tag === "00");
  if (pfi !== -1) tags.splice(pfi + 1, 0, { tag: "01", value: "12" });
  else tags.unshift({ tag: "01", value: "12" });

  // Nominal disisipkan setelah 53 (mata uang) atau 52 (MCC), bila tidak ada
  // sebelum tag 58/59/60/61/62. Urutan tag asli tetap dipertahankan.
  let amountIndex = -1;
  for (const after of ["53", "52"]) {
    const found = tags.findIndex((tag) => tag.tag === after);
    if (found !== -1) {
      amountIndex = found + 1;
      break;
    }
  }
  if (amountIndex === -1) {
    const before = ["58", "59", "60", "61", "62"]
      .map((tag) => tags.findIndex((item) => item.tag === tag))
      .find((index) => index !== -1);
    amountIndex = before ?? tags.length;
  }
  tags.splice(amountIndex, 0, { tag: "54", value: String(options.amount) });

  const body = buildTlv(tags);
  const crc = crc16ccitt(`${body}6304`);
  return `${body}6304${crc}`;
}

export function createDemoQrisPayload() {
  const body = buildTlv([
    { tag: "00", value: "01" },
    { tag: "01", value: "11" },
    { tag: "52", value: "4111" },
    { tag: "53", value: "360" },
    { tag: "58", value: "ID" },
    { tag: "59", value: "MAQOM KUTTAB AL FATIH" },
    { tag: "60", value: "BANDAR LAMPUNG" },
    { tag: "61", value: "35141" },
  ]);
  return `${body}6304${crc16ccitt(`${body}6304`)}`;
}

export function amountWithUniqueCode(baseAmount: number, uniqueCode: number) {
  return baseAmount + uniqueCode;
}
