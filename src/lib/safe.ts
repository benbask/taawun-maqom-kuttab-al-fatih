import "server-only";
import { defaultSettings } from "@/lib/demo/defaults";
import { getStore } from "@/lib/store";
import type { PublicStats, Settings } from "@/lib/types";

export async function safeSettings(): Promise<Settings> {
  try {
    return await getStore().getSettings();
  } catch (error) {
    console.error("[settings] gagal memuat pengaturan:", error);
    return defaultSettings();
  }
}

export function emptyStats(target = 0): PublicStats {
  return {
    total: 0,
    target,
    donorCount: 0,
    studentCount: 0,
    perClass: [],
    umumTotal: 0,
    umumCount: 0,
    uniqueCodeTotal: 0,
    lastUpdated: null,
  };
}

export async function safePublicStats(target = 0): Promise<PublicStats> {
  try {
    return await getStore().getPublicStats();
  } catch (error) {
    console.error("[stats] gagal memuat rekap:", error);
    return emptyStats(target);
  }
}
