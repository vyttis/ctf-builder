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
  const [{ data: profile }, settings] = await Promise.all([
    admin.from("profiles").select("role, ai_monthly_limit").eq("id", user.id).maybeSingle(),
    loadAiSettings(admin),
  ])
  const [used, spent] = await Promise.all([monthActionsByUser(admin, user.id), monthSpendUsd(admin)])
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
