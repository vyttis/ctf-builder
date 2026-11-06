import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSuperAdmin } from "@/lib/access/admin-guard"
import { logAdminAction } from "@/lib/access/approve"

const settingsSchema = z.object({
  ai_monthly_budget_usd: z.number().min(0, "Biudžetas negali būti neigiamas").max(10000),
  ai_user_monthly_limit: z.number().int().min(0).max(10000),
  ai_budget_alert_ratio: z.number().min(0.1).max(1),
})

// PATCH /api/admin/ai-settings: the monthly DI budget, the default personal
// limit and when to warn.
export async function PATCH(request: Request) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Patikrinkite laukus." }, { status: 400 })
  }
  const { error } = await guard.admin
    .from("platform_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString(), updated_by: guard.userId })
    .eq("id", true)
  if (error) return NextResponse.json({ error: "Nepavyko išsaugoti nustatymų." }, { status: 500 })
  await logAdminAction(guard.admin, guard.userId, "ai_settings.update", "platform", null, parsed.data)
  return NextResponse.json({ ok: true })
}
