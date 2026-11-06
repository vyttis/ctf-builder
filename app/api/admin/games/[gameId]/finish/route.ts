import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/auth/roles"

type Params = { params: Promise<{ gameId: string }> }

/**
 * POST: an administrator finishes a running or paused activity of any
 * facilitator, e.g. one left open after a lesson (ADM-14). Answers and
 * results stay; the database keeps the pause time (games_status_rules).
 * Every such finish is written to the admin audit log.
 */
export async function POST(_request: Request, props: Params) {
  const { gameId } = await props.params
  if (!/^[0-9a-f-]{36}$/i.test(gameId)) return NextResponse.json({ error: "Veikla nerasta." }, { status: 404 })

  const supabase = await createClient()
  let actorId: string
  try {
    await requireRole(supabase, "admin", "super_admin")
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("no user")
    actorId = user.id
  } catch {
    return NextResponse.json({ error: "Veiklas baigti gali tik administratorius." }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: game } = await admin.from("games").select("id, title, status, teacher_id").eq("id", gameId).maybeSingle()
  if (!game) return NextResponse.json({ error: "Veikla nerasta." }, { status: 404 })
  if (game.status !== "active" && game.status !== "paused") {
    return NextResponse.json({ error: "Baigti galima tik vykstančią arba pristabdytą veiklą.", code: "not_live" }, { status: 409 })
  }

  const { data: updated, error } = await admin
    .from("games")
    .update({ status: "finished" })
    .eq("id", gameId)
    .in("status", ["active", "paused"])
    .select("id, status")
  if (error) {
    console.error("Admin finish failed", { code: error.code })
    return NextResponse.json({ error: "Nepavyko baigti veiklos." }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Veikla jau baigta. Atnaujinkite puslapį.", code: "not_live" }, { status: 409 })
  }

  const { error: auditError } = await admin.from("admin_audit_log").insert({
    actor_id: actorId,
    action: "game_finish",
    target_type: "game",
    target_id: gameId,
    details: { title: game.title, previous_status: game.status, teacher_id: game.teacher_id },
  })
  if (auditError) console.error("Admin audit log write failed", { code: auditError.code })

  return NextResponse.json({ ok: true })
}
