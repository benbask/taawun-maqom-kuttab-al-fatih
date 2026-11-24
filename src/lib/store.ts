import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { demoStore } from "@/lib/demo/store";
import { supabaseStore } from "@/lib/supabase/store";
import type { Store } from "@/lib/types";

export function getStore(): Store {
  return isSupabaseConfigured ? supabaseStore : demoStore;
}

export function usingSupabase() {
  return isSupabaseConfigured;
}
