import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const renameSchema = z.object({
  name: z.string().trim().min(1, "Įrašykite komandos vardą.").max(30, "Vardas gali būti iki 30 ženklų."),
})

type Params = { params: Promise<{ gameId: string; teamId: string }> }

/**
 * The facilitator's own activity and a team in it, or the response to send.
 * Teams are written with the service role (participants have no accounts),
 * so ownership is checked here first.
 */
async function ownedTeam(gameId: string, teamId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { response: NextResponse.json({ error: "Neautorizuota" }, { status: 401 }) }

  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .eq("teacher_id", user.id)
    .maybeSingle()
  if (!game) return { response: NextResponse.json({ error: "Veikla nerasta" }, { status: 404 }) }

  const admin = createAdminClient()
  const { data: team } = await admin
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .eq("game_id", gameId)
    .maybeSingle()
  if (!team) return { response: NextResponse.json({ error: "Komanda nerasta" }, { status: 404 }) }
  return { admin, team }
}

// PATCH /api/games/[gameId]/teams/[teamId]: rename a team (an unsuitable
// name on the class screen, a typo).
export async function PATCH(request: Request, props: Params) {
  const { gameId, teamId } = await props.params
  const parsed = renameSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Neteisingas vardas." }, { status: 400 })
  }
  const found = await ownedTeam(gameId, teamId)
  if ("response" in found) return found.response

  const { error } = await found.admin.from("teams").update({ name: parsed.data.name }).eq("id", teamId)
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Tokį vardą jau turi kita komanda." }, { status: 409 })
    }
    return NextResponse.json({ error: "Nepavyko pervadinti komandos." }, { status: 500 })
  }
  return NextResponse.json({ id: teamId, name: parsed.data.name })
}

// DELETE /api/games/[gameId]/teams/[teamId]: remove a team (a test team, a
// duplicate). Its answers, hints and reflection go with it.
export async function DELETE(_request: Request, props: Params) {
  const { gameId, teamId } = await props.params
  const found = await ownedTeam(gameId, teamId)
  if ("response" in found) return found.response

  const { error } = await found.admin.from("teams").delete().eq("id", teamId)
  if (error) return NextResponse.json({ error: "Nepavyko pašalinti komandos." }, { status: 500 })
  return NextResponse.json({ ok: true })
}
