import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { ACHIEVEMENT_CONFIG, type AchievementType } from "@/lib/game/achievements"

const paramsSchema = z.object({ gameId: z.string().uuid() })

// GET /api/games/[gameId]/achievements — achievement distribution for teacher
export async function GET(
  _request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const paramsParsed = paramsSchema.safeParse(params)
    if (!paramsParsed.success) {
      return NextResponse.json({ error: "Neteisingas žaidimo ID" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neprisijungęs" }, { status: 401 })
    }

    // Verify game access (owner or admin)
    const { data: game } = await supabase
      .from("games")
      .select("id, teacher_id")
      .eq("id", params.gameId)
      .maybeSingle()

    if (!game) {
      return NextResponse.json(
        { error: "Žaidimas nerastas" },
        { status: 404 }
      )
    }

    // Check if user is owner or admin
    if (game.teacher_id !== user.id) {
      const { data: roleData } = await supabase.rpc("get_my_role")
      if (
        !roleData ||
        !["admin", "super_admin"].includes(roleData as string)
      ) {
        return NextResponse.json(
          { error: "Neturite prieigos" },
          { status: 403 }
        )
      }
    }

    // Query achievements joined with teams
    const { data: achievements, error } = await supabase
      .from("achievements")
      .select(
        `
        id,
        type,
        challenge_id,
        metadata,
        earned_at,
        teams!inner (
          id,
          name
        )
      `
      )
      .eq("game_id", params.gameId)
      .order("earned_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by type with counts
    const grouped: Record<
      string,
      {
        type: AchievementType
        name: string
        icon: string
        color: string
        count: number
        details: {
          teamId: string
          teamName: string
          challengeId: string | null
          metadata: Record<string, unknown>
          earnedAt: string
        }[]
      }
    > = {}

    // Initialize all types so the response always includes every badge type
    for (const [type, config] of Object.entries(ACHIEVEMENT_CONFIG)) {
      grouped[type] = {
        type: type as AchievementType,
        name: config.name,
        icon: config.icon,
        color: config.color,
        count: 0,
        details: [],
      }
    }

    for (const row of achievements ?? []) {
      const team = row.teams as unknown as { id: string; name: string }
      const group = grouped[row.type]
      if (group) {
        group.count++
        group.details.push({
          teamId: team.id,
          teamName: team.name,
          challengeId: row.challenge_id,
          metadata: row.metadata as Record<string, unknown>,
          earnedAt: row.earned_at,
        })
      }
    }

    return NextResponse.json({
      achievements: Object.values(grouped),
      total: achievements?.length ?? 0,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverio klaida" },
      { status: 500 }
    )
  }
}
