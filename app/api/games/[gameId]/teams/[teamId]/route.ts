import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const renameSchema = z.object({
  name: z.string().trim().min(1, "Įrašykite komandos vardą.").max(30, "Vardas gali būti iki 30 ženklų."),
})

type Params = { params: Promise<{ gameId: string; teamId: string }> }
type Supabase = Awaited<ReturnType<typeof createClient>>

// A response body is read once, so every request gets its own.
const notLive = () =>
  NextResponse.json({ error: "Komandas tvarkyti galima tik vykstant veiklai.", code: "not_live" }, { status: 409 })

/**
 * Renames or removes a team through moderate_team() (20261106160000): it
 * checks the active account, the owner and the running activity in the same
 * transaction as the change, holding the activity row, so finishing the
 * activity at the same moment cannot slip in between. A finished activity
 * is a record: removing a team would take its answers out of the report.
 * Without the function (not applied yet) the same checks run here, with the
 * account status read fresh rather than from the proxy's cache.
 */
async function moderate(gameId: string, teamId: string, change: { name: string } | { remove: true }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })

  const remove = "remove" in change
  const { error } = await supabase.rpc("moderate_team", {
    p_game_id: gameId,
    p_team_id: teamId,
    p_name: remove ? null : change.name,
    p_remove: remove,
  })
  if (!error) return null
  if (error.code === "PGRST202" || error.code === "42883") {
    return moderateWithoutFunction(supabase, user.id, gameId, teamId, change)
  }
  return errorResponse(error.code, remove)
}

function errorResponse(code: string | undefined, remove: boolean) {
  if (code === "42501") {
    return NextResponse.json({ error: "Paskyra neaktyvi, todėl veiklos keisti negalima." }, { status: 403 })
  }
  if (code === "P0002") return NextResponse.json({ error: "Komanda nerasta" }, { status: 404 })
  if (code === "KS409") return notLive()
  if (code === "23505") return NextResponse.json({ error: "Tokį vardą jau turi kita komanda." }, { status: 409 })
  if (code === "22023") return NextResponse.json({ error: "Vardas gali būti iki 30 ženklų." }, { status: 400 })
  return NextResponse.json(
    { error: remove ? "Nepavyko pašalinti komandos." : "Nepavyko pervadinti komandos." },
    { status: 500 }
  )
}

async function moderateWithoutFunction(
  supabase: Supabase,
  userId: string,
  gameId: string,
  teamId: string,
  change: { name: string } | { remove: true }
) {
  const remove = "remove" in change
  const { data: profile } = await supabase.from("profiles").select("status").eq("id", userId).maybeSingle()
  if (profile?.status !== "active") return errorResponse("42501", remove)

  const { data: game } = await supabase
    .from("games")
    .select("id, status")
    .eq("id", gameId)
    .eq("teacher_id", userId)
    .maybeSingle()
  if (!game) return NextResponse.json({ error: "Veikla nerasta" }, { status: 404 })
  if (game.status !== "active" && game.status !== "paused") return notLive()

  const admin = createAdminClient()
  const query = remove
    ? admin.from("teams").delete().eq("id", teamId).eq("game_id", gameId).select("id")
    : admin.from("teams").update({ name: change.name }).eq("id", teamId).eq("game_id", gameId).select("id")
  const { data, error } = await query
  if (error) return errorResponse(error.code, remove)
  if (!data || data.length === 0) return errorResponse("P0002", remove)
  return null
}

// PATCH /api/games/[gameId]/teams/[teamId]: rename a team (an unsuitable
// name on the class screen, a typo).
export async function PATCH(request: Request, props: Params) {
  const { gameId, teamId } = await props.params
  const parsed = renameSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Neteisingas vardas." }, { status: 400 })
  }
  const failed = await moderate(gameId, teamId, { name: parsed.data.name })
  if (failed) return failed
  return NextResponse.json({ id: teamId, name: parsed.data.name })
}

// DELETE /api/games/[gameId]/teams/[teamId]: remove a team (a test team, a
// duplicate). Its answers, hints and reflection go with it.
export async function DELETE(_request: Request, props: Params) {
  const { gameId, teamId } = await props.params
  const failed = await moderate(gameId, teamId, { remove: true })
  if (failed) return failed
  return NextResponse.json({ ok: true })
}
