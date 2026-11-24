export class NoUniqueCodeError extends Error {
  constructor() {
    super("Tidak ada kode unik 3 digit yang tersedia. Coba lagi setelah invoice lama kedaluwarsa.");
    this.name = "NoUniqueCodeError";
  }
}

export interface UniqueCodeInput {
  baseAmount: number;
  baseCode: number;
  maxDigits?: number;
  usedTotals?: Iterable<number>;
  usedCodes?: Iterable<number>;
}

export function normalizeUniqueCodeBase(baseCode: number, maxDigits = 3) {
  const max = 10 ** maxDigits - 1;
  const normalized = ((Math.trunc(Math.abs(baseCode)) - 1) % max) + 1;
  return normalized;
}

/**
 * Admin-set unique code, max 3 digits. The preferred order follows the
 * requested example 9, 19, 29, ... 999. If the base amount + code collides
 * with another invoice, the next code is used. After the +10 pattern is
 * exhausted, any unused 3-digit code is used.
 */
export function findUniqueCode({
  baseAmount,
  baseCode,
  maxDigits = 3,
  usedTotals = [],
  usedCodes = [],
}: UniqueCodeInput): number {
  if (!Number.isInteger(baseAmount) || baseAmount <= 0) {
    throw new Error("Nominal dasar tidak valid.");
  }

  const max = 10 ** maxDigits - 1;
  const base = normalizeUniqueCodeBase(baseCode, maxDigits);
  const totals = new Set(usedTotals);
  const codes = new Set(usedCodes);
  const candidates: number[] = [];

  for (let code = base; code <= max; code += 10) candidates.push(code);
  for (let code = 1; code <= max; code += 1) {
    if (!candidates.includes(code)) candidates.push(code);
  }

  for (const code of candidates) {
    if (codes.has(code)) continue;
    if (!totals.has(baseAmount + code)) return code;
  }

  throw new NoUniqueCodeError();
}

export function uniqueCodePattern(baseCode: number, maxDigits = 3, limit = 12) {
  const max = 10 ** maxDigits - 1;
  const base = normalizeUniqueCodeBase(baseCode, maxDigits);
  const result: number[] = [];
  for (let code = base; code <= max && result.length < limit; code += 10) {
    result.push(code);
  }
  return result;
}
