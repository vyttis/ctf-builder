import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/games/[gameId]/analytics — get game statistics
export async function GET(_request: Request, props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
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
      .select("id, teacher_id, title")
      .eq("id", params.gameId)
      .maybeSingle()

    if (!game) {
      return NextResponse.json({ error: "Veikla nerasta" }, { status: 404 })
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

    // Get stats via RPC function
    const { data: stats, error } = await supabase.rpc("get_game_stats", {
      game_uuid: params.gameId,
    })

    if (error) {
      console.error("analytics stats error:", error.message)
      return NextResponse.json({ error: "Nepavyko gauti statistikos." }, { status: 500 })
    }

    // The title names the exported results file.
    return NextResponse.json({ ...((stats as object | null) ?? {}), game_title: game.title })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverio klaida" },
      { status: 500 }
    )
  }
}
