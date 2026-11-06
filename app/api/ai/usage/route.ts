import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadAiSettings, monthActionsByUser, monthSpendUsd, resetsOnText } from "@/lib/ai/usage"

// GET /api/ai/usage: the signed-in facilitator's DI allowance this month,
// shown next to the DI buttons.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Prisijunkite." }, { status: 401 })

  const admin = createAdminClient()
  let profile: { role: string; ai_monthly_limit: number | null } | null
  let settings: Awaited<ReturnType<typeof loadAiSettings>>
  let used: number
  let spent: number
  try {
    const [profileRes, loaded] = await Promise.all([
      admin.from("profiles").select("role, ai_monthly_limit").eq("id", user.id).maybeSingle(),
      loadAiSettings(admin),
    ])
    if (profileRes.error) throw profileRes.error
    profile = profileRes.data
    settings = loaded
    ;[used, spent] = await Promise.all([monthActionsByUser(admin, user.id), monthSpendUsd(admin)])
  } catch {
    // The note next to the DI buttons simply stays hidden.
    return NextResponse.json({ error: "DI likučio dabar gauti nepavyko." }, { status: 503 })
  }
  const unlimited = profile?.role === "super_admin"
  const limit = unlimited ? null : profile?.ai_monthly_limit ?? settings.ai_user_monthly_limit
  const budgetBlocked = !unlimited && spent >= settings.ai_monthly_budget_usd
  return NextResponse.json(
    {
      used,
      limit,
      remaining: limit === null ? null : Math.max(0, limit - used),
      resetsOn: resetsOnText(),
      blocked: budgetBlocked ? "ai_budget" : limit !== null && used >= limit ? "ai_user_limit" : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
