export type AutoVerifyStatus = "matched" | "needs_review" | "skipped";

export interface AutoVerifyResult {
  status: AutoVerifyStatus;
  amount: number | null;
  reason?: string;
}

const MONEY_HINT =
  /(rp|total|jumlah|nominal|bayar|transfer|tagihan|grand total)/i;

/**
 * Mengubah potongan angka hasil OCR menjadi nominal Rupiah.
 * Contoh: "100.059,00" -> 100059, "1.500.000" -> 1500000,
 * "100,059.00" -> 100059.
 */
export function parseAmountToken(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!/\d/.test(cleaned)) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const lastSeparator = Math.max(lastComma, lastDot);

  let decimalSeparator: "," | "." | null = null;
  if (lastSeparator >= 0) {
    const decimals = cleaned.length - lastSeparator - 1;
    // Pemisah desimal diikuti tepat 2 digit (mis. ",00" atau ".00").
    if (decimals === 2) {
      decimalSeparator = cleaned[lastSeparator] as "," | ".";
    }
  }

  let normalized: string;
  if (decimalSeparator) {
    const groupingSeparator = decimalSeparator === "," ? "." : ",";
    normalized = cleaned
      .split(groupingSeparator)
      .join("")
      .replace(decimalSeparator, ".");
  } else {
    normalized = cleaned.replace(/[.,]/g, "");
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value) : null;
}

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
      const value = parseAmountToken(raw);
      if (value === null) continue;

      // Nomor invoice/tanggal biasanya pendek; nominal transfer Ta'awun
      // berada pada rentang ini.
      if (value < 1000 || value > 100_000_000) continue;

      // Kode pos / ID merchant juga pakai koma atau titik, jangan dianggap
      // nominal transfer tanpa petunjuk "Rp"/"total"/"bayar" dan tanpa
      // pengelompokan ribuan Rupiah.
      const hasRupiahPrefix = /rp\.?\s*/i.test(raw);
      const hasThousandGrouping = /^\d{1,3}(?:\.\d{3})+(?:[.,]\d{1,2})?$|^\d+,\d{2}$/.test(
        raw.trim(),
      );
      if (!hasHint && !hasRupiahPrefix && !hasThousandGrouping) continue;

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
  if (amounts.length === 0) {
    return {
      status: "needs_review",
      amount: null,
      reason: "Nominal transfer tidak terbaca pada bukti.",
      confidence: safeConfidence,
    };
  }
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
