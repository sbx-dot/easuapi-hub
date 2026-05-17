import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return url.replace(/\/(?:rest|auth)\/v1\/?$/u, "").replace(/\/+$/u, "");
  }
}

export function getSupabaseAdmin() {
  const rawSupabaseUrl =
    process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!rawSupabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(normalizeSupabaseUrl(rawSupabaseUrl), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
