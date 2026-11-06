import { NextResponse, after } from "next/server"
import { z } from "zod"
import { requireSuperAdmin } from "@/lib/access/admin-guard"
import { logAdminAction, publicBaseUrl } from "@/lib/access/approve"
import { sendEmail } from "@/lib/email/send"
import { accountActivatedEmail } from "@/lib/email/templates"

const statusSchema = z.object({ status: z.enum(["active", "blocked"]) })

// PATCH /api/admin/users/[id]/status: block or unblock a facilitator, or
// approve one who is waiting. Blocking stops writes at once (database
// policies) and sends the person to /laukia on the next page load. Approving
// a waiting account does what approving its request does: the request is
// closed as approved and the person gets the "account activated" email.
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  if (id === guard.userId) {
    return NextResponse.json({ error: "Savo paskyros užblokuoti negalite." }, { status: 400 })
  }
  const parsed = statusSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Neteisingas statusas." }, { status: 400 })

  const { data: before } = await guard.admin
    .from("profiles")
    .select("status, email, first_name")
    .eq("id", id)
    .maybeSingle()
  if (!before) return NextResponse.json({ error: "Vartotojas nerastas." }, { status: 404 })

  const update: Record<string, unknown> = { status: parsed.data.status }
  if (parsed.data.status === "active" && before.status === "pending") {
    update.approved_at = new Date().toISOString()
    update.approved_by = guard.userId
  }
  const { error } = await guard.admin.from("profiles").update(update).eq("id", id)
  if (error) return NextResponse.json({ error: "Nepavyko pakeisti statuso." }, { status: 500 })

  const approving = parsed.data.status === "active" && before.status === "pending"
  if (approving && before.email) {
    const now = new Date().toISOString()
    const emails = Array.from(new Set([before.email, before.email.toLowerCase()]))
    const { error: requestError } = await guard.admin
      .from("access_requests")
      .update({ status: "approved", user_id: id, reviewed_by: guard.userId, reviewed_at: now })
      .in("email", emails)
      .eq("status", "pending")
    if (requestError) console.error("[users] approved but request not closed", { code: requestError.code })
    const loginUrl = `${publicBaseUrl(new URL(request.url).origin)}/vedejui`
    after(() => sendEmail(accountActivatedEmail(before.email, before.first_name ?? null, loginUrl)))
  }

  const action = parsed.data.status === "blocked" ? "block" : approving ? "approve" : "unblock"
  await logAdminAction(guard.admin, guard.userId, `profile.${action}`, "profile", id, {
    email: before.email,
    from: before.status,
  })
  return NextResponse.json({ ok: true })
}
