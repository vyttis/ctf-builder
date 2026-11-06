import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSuperAdmin } from "@/lib/access/admin-guard"
import { logAdminAction } from "@/lib/access/approve"

const statusSchema = z.object({ status: z.enum(["active", "blocked"]) })

// PATCH /api/admin/users/[id]/status: block or unblock a facilitator.
// Blocking stops writes at once (database policies) and sends the person to
// /laukia on the next page load.
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  if (id === guard.userId) {
    return NextResponse.json({ error: "Savo paskyros užblokuoti negalite." }, { status: 400 })
  }
  const parsed = statusSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Neteisingas statusas." }, { status: 400 })

  const { data: before } = await guard.admin.from("profiles").select("status, email").eq("id", id).maybeSingle()
  if (!before) return NextResponse.json({ error: "Vartotojas nerastas." }, { status: 404 })

  const update: Record<string, unknown> = { status: parsed.data.status }
  if (parsed.data.status === "active" && before.status === "pending") {
    update.approved_at = new Date().toISOString()
    update.approved_by = guard.userId
  }
  const { error } = await guard.admin.from("profiles").update(update).eq("id", id)
  if (error) return NextResponse.json({ error: "Nepavyko pakeisti statuso." }, { status: 500 })

  await logAdminAction(guard.admin, guard.userId, `profile.${parsed.data.status === "blocked" ? "block" : "unblock"}`, "profile", id, {
    email: before.email,
    from: before.status,
  })
  return NextResponse.json({ ok: true })
}
