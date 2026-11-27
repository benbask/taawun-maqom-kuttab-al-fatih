import type { PublicStats } from "@/lib/types";

/** Cache-buster untuk kartu pratinjau WhatsApp. */
export function shareCardVersion(stats: PublicStats): string {
  const { total, ots } = stats;
  return [
    total,
    ots.total,
    ots.terdaftar,
    ots.hadir,
    ots.tidak,
    ots.belumDaftar,
    ots.bertaawun,
  ].join("-");
}
