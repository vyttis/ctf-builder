import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/roles"

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
  const role = await getUserRole(supabase)
  if (role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Tik super administratorius gali tai daryti." }, { status: 403 }),
    }
  }
  return { ok: true, userId: user.id, admin: createAdminClient() }
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}
