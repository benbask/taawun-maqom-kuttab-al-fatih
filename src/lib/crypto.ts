import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { OTP_SECRET } from "@/lib/env";

export function randomOtp() {
  return crypto.randomInt(1000, 10000).toString();
}

export function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashOtp(phone: string, code: string) {
  return sha256(`${phone}:${code}:${OTP_SECRET}`);
}

function otpKey() {
  return crypto.createHash("sha256").update(OTP_SECRET).digest();
}

export function encryptSecret(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", otpKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload: string) {
  try {
    const [ivText, tagText, dataText] = payload.split(".");
    if (!ivText || !tagText || !dataText) return null;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      otpKey(),
      Buffer.from(ivText, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function timingSafeEqualText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
