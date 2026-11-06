import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createRejoinToken } from "@/lib/game/rejoin-token"

type Params = { params: Promise<{ gameId: string; teamId: string }> }

/**
 * POST — a ten-minute link that lets a team continue on another device
 * (a dead phone, another browser, an accidental "Išeiti"). Only the owner of
 * a running or paused activity gets one; the account status is read fresh.
 * The path carries the token after "#", so it is not sent to the server or
 * kept in access logs when the page opens.
 */
export async function POST(_request: Request, props: Params) {
  const { gameId, teamId } = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", user.id).maybeSingle()
  if (profile?.status !== "active") {
    return NextResponse.json({ error: "Paskyra neaktyvi, todėl veiklos keisti negalima." }, { status: 403 })
  }

  const { data: game } = await supabase
    .from("games")
    .select("id, status, game_code")
    .eq("id", gameId)
    .eq("teacher_id", user.id)
    .maybeSingle()
  if (!game) return NextResponse.json({ error: "Veikla nerasta" }, { status: 404 })
  if (game.status !== "active" && game.status !== "paused") {
    return NextResponse.json({ error: "Komandą grąžinti galima tik vykstant veiklai.", code: "not_live" }, { status: 409 })
  }

  const { data: team } = await supabase.from("teams").select("id").eq("id", teamId).eq("game_id", gameId).maybeSingle()
  if (!team) return NextResponse.json({ error: "Komanda nerasta" }, { status: 404 })

  const { token, expiresAt } = createRejoinToken(team.id)
  return NextResponse.json(
    { path: `/play/${game.game_code}/grizti#${token}`, expires_at: new Date(expiresAt).toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  )
}
