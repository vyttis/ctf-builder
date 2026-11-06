import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Access requests, request links and account decisions belong to the super
 * admin only. Returns the caller and a service-role client, or the response
 * to send back.
 */
export async function requireSuperAdmin(): Promise<
  { ok: true; userId: string; admin: SupabaseClient } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Prisijunkite." }, { status: 401 }) }
  }
  // Role and status read fresh with the service role: the proxy caches
  // active accounts for a short time, and a blocked super admin keeps the
  // role, so neither is enough for service-role actions.
  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role, status").eq("id", user.id).maybeSingle()
  if (profile?.role !== "super_admin" || profile.status !== "active") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Tik super administratorius gali tai daryti." }, { status: 403 }),
    }
  }
  return { ok: true, userId: user.id, admin }
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}
