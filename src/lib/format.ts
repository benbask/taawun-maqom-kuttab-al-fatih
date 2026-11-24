const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number) {
  return rupiah.format(value).replace(/\s+/g, " ");
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function toIsoOrNull(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.startsWith("8")) digits = `62${digits}`;
  if (!digits.startsWith("62")) return null;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function formatPhone(phone: string) {
  if (!phone.startsWith("62")) return phone;
  const rest = phone.slice(2);
  const groups = rest.match(/.{1,4}/g) ?? [rest];
  return `+62 ${groups.join("-")}`;
}

export function phoneLocal(phone: string) {
  if (phone.startsWith("62")) return `0${phone.slice(2)}`;
  return phone;
}

export function maskName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}***`)
    .join(" ");
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `•••• ${digits.slice(-4)}`;
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function amountFromInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function invoiceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu pembayaran",
    waiting_verification: "Menunggu verifikasi",
    verified: "Terverifikasi",
    rejected: "Ditolak",
    expired: "Kedaluwarsa",
    cancelled: "Dibatalkan",
  };
  return labels[status] ?? status;
}

export function invoiceStatusTone(status: string) {
  switch (status) {
    case "verified":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "waiting_verification":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "rejected":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "pending":
      return "bg-sky-100 text-sky-800 border-sky-200";
    default:
      return "bg-stone-100 text-stone-700 border-stone-200";
  }
}
