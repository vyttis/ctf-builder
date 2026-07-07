import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { computeDetailedStats } from "@/lib/game/detailed-stats"
import { unauthorized, forbidden, notFound, serverError } from "@/lib/api/responses"

// GET /api/games/[gameId]/analytics/detailed — per-challenge + per-team detailed stats
export async function GET(
  _request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return unauthorized()
    }

    // Verify game access
    const { data: game } = await supabase
      .from("games")
      .select("id, teacher_id")
      .eq("id", params.gameId)
      .maybeSingle()

    if (!game) {
      return notFound("Žaidimas nerastas")
    }

    if (game.teacher_id !== user.id) {
      const { data: roleData } = await supabase.rpc("get_my_role")
      if (!roleData || !["admin", "super_admin"].includes(roleData as string)) {
        return forbidden("Neturite prieigos")
      }
    }

    const stats = await computeDetailedStats(supabase, params.gameId)
    return NextResponse.json(stats)
  } catch (error: unknown) {
    return serverError(
      error instanceof Error ? error.message : "Serverio klaida"
    )
  }
}
