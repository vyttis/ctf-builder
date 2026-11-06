import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSuperAdmin } from "@/lib/access/admin-guard"
import { logAdminAction } from "@/lib/access/approve"

const limitSchema = z.object({
  // null = the platform default
  ai_monthly_limit: z.number().int().min(0).max(10000).nullable(),
})

// PATCH /api/admin/users/[id]/ai-limit: a personal monthly DI limit.
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  const parsed = limitSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Neteisingas limitas." }, { status: 400 })
  const { data, error } = await guard.admin
    .from("profiles")
    .update({ ai_monthly_limit: parsed.data.ai_monthly_limit })
    .eq("id", id)
    .select("id")
  if (error) return NextResponse.json({ error: "Nepavyko išsaugoti." }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json({ error: "Vartotojas nerastas." }, { status: 404 })
  await logAdminAction(guard.admin, guard.userId, "profile.ai_limit", "profile", id, parsed.data)
  return NextResponse.json({ ok: true })
}
