import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { STALE_MIN_AGE_MS, isStaleActivity, latest } from "@/lib/game/stale"

export const maxDuration = 60

type LiveGame = {
  id: string
  title: string
  status: string
  teacher_id: string
  starts_at: string | null
  created_at: string
  updated_at: string
}

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
function authorized(request: Request, secret: string): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "")
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/**
 * GET (Vercel Cron, nightly): finishes activities left running after a
 * lesson, see lib/game/stale.ts for the rule. Same effect as the admin
 * "Baigti" (results stay, the database keeps the pause time), written to
 * the admin audit log as game_auto_finish without an actor.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  // Without a secret nobody may run it (fail closed).
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 })
  if (!authorized(request, secret)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const now = Date.now()
  const startedBefore = new Date(now - STALE_MIN_AGE_MS).toISOString()

  const { data, error } = await admin
    .from("games")
    .select("id, title, status, teacher_id, starts_at, created_at, updated_at")
    .in("status", ["active", "paused"])
    .or(`starts_at.lt.${startedBefore},and(starts_at.is.null,created_at.lt.${startedBefore})`)
    .limit(200)
  if (error) {
    console.error(JSON.stringify({ event: "auto_finish_list_failed", code: error.code }))
    return NextResponse.json({ error: "list failed" }, { status: 500 })
  }

  const games = (data ?? []) as LiveGame[]
  const finished: string[] = []
  let failed = 0

  for (const game of games) {
    const [teamRes, subRes] = await Promise.all([
      admin.from("teams").select("joined_at").eq("game_id", game.id).order("joined_at", { ascending: false }).limit(1),
      admin
        .from("submissions")
        .select("attempted_at, teams!inner(game_id)")
        .eq("teams.game_id", game.id)
        .order("attempted_at", { ascending: false })
        .limit(1),
    ])
    // A failed read is not proof of silence: skip this activity.
    if (teamRes.error || subRes.error) {
      failed++
      continue
    }

    const startedAt = game.starts_at ?? game.created_at
    const lastActivityAt =
      latest(game.updated_at, teamRes.data?.[0]?.joined_at, subRes.data?.[0]?.attempted_at) ?? startedAt
    if (!isStaleActivity({ startedAt, lastActivityAt }, now)) continue

    const { data: updated, error: updateError } = await admin
      .from("games")
      .update({ status: "finished" })
      .eq("id", game.id)
      .in("status", ["active", "paused"])
      .select("id")
    if (updateError) {
      failed++
      console.error(JSON.stringify({ event: "auto_finish_failed", game: game.id, code: updateError.code }))
      continue
    }
    // Finished meanwhile by the facilitator or an administrator.
    if (!updated || updated.length === 0) continue
    finished.push(game.id)

    const { error: auditError } = await admin.from("admin_audit_log").insert({
      actor_id: null,
      action: "game_auto_finish",
      target_type: "game",
      target_id: game.id,
      details: {
        title: game.title,
        previous_status: game.status,
        teacher_id: game.teacher_id,
        started_at: startedAt,
        last_activity_at: lastActivityAt,
      },
    })
    if (auditError) console.error(JSON.stringify({ event: "auto_finish_audit_failed", code: auditError.code }))
  }

  console.log(JSON.stringify({ event: "auto_finish_done", checked: games.length, finished: finished.length, failed }))
  return NextResponse.json({ checked: games.length, finished: finished.length, failed })
}
