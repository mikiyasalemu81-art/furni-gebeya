import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "@/lib/env";

export function getSupabaseAdmin() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    serviceRoleKey.includes("mock") ||
    serviceRoleKey.includes("placeholder")
  ) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
