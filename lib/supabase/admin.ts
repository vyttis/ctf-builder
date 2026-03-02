import { createClient } from "@supabase/supabase-js"

// Server-only: bypasses RLS for player operations
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE env vars: " +
      (!url ? "NEXT_PUBLIC_SUPABASE_URL " : "") +
      (!key ? "SUPABASE_SERVICE_ROLE_KEY" : "")
    )
  }

  return createClient(url, key)
}
