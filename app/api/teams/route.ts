import { createAdminClient } from "@/lib/supabase/admin"
import { generateSessionToken } from "@/lib/game/code-generator"
import { NextResponse } from "next/server"
import { z } from "zod"

const createTeamSchema = z.object({
  game_code: z.string().length(6),
  team_name: z.string().min(1, "Komandos vardas privalomas").max(30),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = createTeamSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Find the active game
  const { data: game } = await supabase
    .from("games")
    .select("id, settings")
    .eq("game_code", parsed.data.game_code)
    .eq("status", "active")
    .single()

  if (!game) {
    return NextResponse.json(
      { error: "Žaidimas nerastas arba neaktyvus" },
      { status: 404 }
    )
  }

  // Check max teams
  const { count: teamCount } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })
    .eq("game_id", game.id)

  const settings = game.settings as Record<string, unknown> | null
  const maxTeams = (settings?.max_teams as number) || 50
  if (teamCount && teamCount >= maxTeams) {
    return NextResponse.json(
      { error: "Žaidimas pilnas — pasiektas maksimalus komandų skaičius" },
      { status: 400 }
    )
  }

  // Check if team name is taken
  const { data: existingTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("game_id", game.id)
    .eq("name", parsed.data.team_name)
    .single()

  if (existingTeam) {
    return NextResponse.json(
      { error: "Šis komandos vardas jau užimtas" },
      { status: 400 }
    )
  }

  const sessionToken = generateSessionToken()

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      game_id: game.id,
      name: parsed.data.team_name,
      session_token: sessionToken,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      team_id: team.id,
      session_token: sessionToken,
      game_id: game.id,
      team_name: team.name,
    },
    { status: 201 }
  )
}
