import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/games/[gameId]/reflections — teacher gets game reflections
export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
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
      .single()

    if (!game) {
      return NextResponse.json({ error: "Žaidimas nerastas" }, { status: 404 })
    }

    // Check if user is owner or admin
    if (game.teacher_id !== user.id) {
      const { data: roleData } = await supabase.rpc("get_my_role")
      if (!roleData || !["admin", "super_admin"].includes(roleData as string)) {
        return NextResponse.json(
          { error: "Neturite prieigos" },
          { status: 403 }
        )
      }
    }

    // Get reflections via RPC function
    const { data: reflections, error } = await supabase.rpc(
      "get_game_reflections",
      { game_uuid: params.gameId }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get total teams count for this game
    const { count: totalTeams } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("game_id", params.gameId)

    return NextResponse.json({
      reflections: reflections || [],
      total_teams: totalTeams || 0,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverio klaida" },
      { status: 500 }
    )
  }
}
