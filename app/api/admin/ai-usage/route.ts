import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/access/admin-guard"
import { loadAiSettings, monthGenitive, monthSpendUsd, resetsOnText, usageByUser } from "@/lib/ai/usage"

// GET /api/admin/ai-usage: this month's DI spend, budget and per-person use.
export async function GET() {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  try {
    const [settings, spent, users] = await Promise.all([
      loadAiSettings(guard.admin),
      monthSpendUsd(guard.admin, new Date(), true),
      usageByUser(guard.admin),
    ])
    return NextResponse.json(
      { settings, spentUsd: Math.round(spent * 100) / 100, month: monthGenitive(), resetsOn: resetsOnText(), users },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("[admin/ai-usage] failed", { error: error instanceof Error ? error.message : "unknown" })
    return NextResponse.json({ error: "Nepavyko gauti DI naudojimo." }, { status: 500 })
  }
}
