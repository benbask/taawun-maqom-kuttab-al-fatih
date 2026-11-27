import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_SECRET } from "@/lib/env";

const TOKEN_TTL_MS = 5 * 60 * 1000;

function sign(invoiceId: string, expires: number) {
  return createHmac("sha256", SESSION_SECRET)
    .update(`${invoiceId}:${expires}`)
    .digest("hex");
}

/**
 * Token sementara untuk memanggil layanan OCR internal. Dipakai agar endpoint
 * OCR tidak bisa dipicu sembarang orang dari luar.
 */
export function createOcrToken(invoiceId: string) {
  const expires = Date.now() + TOKEN_TTL_MS;
  return { expires, signature: sign(invoiceId, expires) };
}

export function verifyOcrToken(input: {
  invoiceId: string;
  expires: number;
  signature: string;
}) {
  if (!Number.isFinite(input.expires) || input.expires < Date.now()) {
    return false;
  }
  const expected = Buffer.from(sign(input.invoiceId, input.expires), "hex");
  const provided = Buffer.from(input.signature ?? "", "hex");
  if (expected.length === 0 || expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}
