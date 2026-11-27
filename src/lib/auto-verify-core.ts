export type AutoVerifyStatus = "matched" | "needs_review" | "skipped";

export interface AutoVerifyResult {
  status: AutoVerifyStatus;
  amount: number | null;
  reason?: string;
}

const MONEY_HINT =
  /(rp|total|jumlah|nominal|bayar|transfer|tagihan|grand total)/i;

/**
 * Mengambil kemungkinan nominal Rupiah dari teks OCR.
 * Contoh: "Rp 1.500.000" -> 1500000.
 */
export function extractAmounts(text: string): number[] {
  const values = new Set<number>();

  for (const line of text.split(/[\r\n]+/)) {
    const hasHint = MONEY_HINT.test(line);
    const match = line.match(/(?:rp\.?\s*)?([\d][\d.,\s]*)/gi);
    if (!match) continue;

    for (const raw of match) {
      const digits = raw.replace(/[^\d]/g, "");
      if (!digits) continue;

      const value = Number(digits);
      if (!Number.isFinite(value)) continue;

      // Nomor invoice/tanggal biasanya pendek; nominal transfer Ta'awun
      // berada pada rentang ini.
      if (value < 1000 || value > 100_000_000) continue;

      const hasSeparator = /[.,]/.test(raw);
      if (!hasHint && !hasSeparator) continue;

      values.add(value);
    }
  }

  return [...values].sort((a, b) => b - a);
}

/**
 * Menilai hasil OCR terhadap total transfer yang diharapkan.
 * Hanya mencocokkan persis; keraguan selalu dikembalikan ke admin.
 */
export function evaluateAutoVerify({
  text,
  confidence,
  expectedAmount,
}: {
  text: string;
  confidence: number;
  expectedAmount: number;
}): AutoVerifyResult & { confidence: number } {
  const safeConfidence = Number.isFinite(confidence) ? confidence : 0;

  if (!text.trim()) {
    return {
      status: "needs_review",
      amount: null,
      reason: "Teks bukti tidak terbaca.",
      confidence: safeConfidence,
    };
  }

  if (safeConfidence < 60) {
    return {
      status: "needs_review",
      amount: extractAmounts(text)[0] ?? null,
      reason: "Keyakinan OCR terlalu rendah.",
      confidence: safeConfidence,
    };
  }

  const amounts = extractAmounts(text);
  if (amounts.includes(expectedAmount)) {
    return {
      status: "matched",
      amount: expectedAmount,
      confidence: safeConfidence,
    };
  }

  return {
    status: "needs_review",
    amount: amounts[0] ?? null,
    reason: "Nominal transfer tidak cocok dengan invoice.",
    confidence: safeConfidence,
  };
}
