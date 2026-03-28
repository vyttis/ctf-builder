import { createAdminClient } from "@/lib/supabase/admin"
import { generateSessionToken } from "@/lib/game/code-generator"
import { NextResponse } from "next/server"
import { z } from "zod"

const createTeamSchema = z.object({
  game_code: z.string().length(6),
  team_name: z.string().min(1, "Komandos vardas privalomas").max(30),
})

// In-memory rate limiter by IP
// Higher limit for classroom environments where many teams share the same network
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60_000
const CLEANUP_INTERVAL = 5 * 60_000 // cleanup stale entries every 5 min
let lastCleanup = Date.now()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  // Periodic cleanup of expired entries to prevent memory leaks
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    rateLimitMap.forEach((val, key) => {
      if (now > val.resetAt) rateLimitMap.delete(key)
    })
    lastCleanup = now
  }
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Per daug užklausų. Palaukite minutę." },
        { status: 429 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Netinkamas užklausos formatas" }, { status: 400 })
    }

    const parsed = createTeamSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Neteisingi duomenys"
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find the active game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, settings")
      .eq("game_code", parsed.data.game_code)
      .eq("status", "active")
      .single()

    if (gameError || !game) {
      console.error("Game lookup failed:", gameError?.message)
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
      console.error("Team insert failed:", error.message)
      return NextResponse.json({ error: "Nepavyko sukurti komandos" }, { status: 500 })
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
  } catch (err) {
    console.error("Teams API error:", err)
    return NextResponse.json(
      { error: "Serverio klaida. Bandykite dar kartą." },
      { status: 500 }
    )
  }
}
