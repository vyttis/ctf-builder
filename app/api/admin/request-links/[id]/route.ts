import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/access/admin-guard"
import { logAdminAction } from "@/lib/access/approve"

// DELETE /api/admin/request-links/[id]: revoke (the row stays, so requests
// keep showing where they came from).
export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  const { error } = await guard.admin
    .from("request_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null)
  if (error) return NextResponse.json({ error: "Nepavyko atšaukti nuorodos." }, { status: 500 })
  await logAdminAction(guard.admin, guard.userId, "request_link.revoke", "request_link", id)
  return NextResponse.json({ ok: true })
}
