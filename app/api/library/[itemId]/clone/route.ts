import { createClient } from "@/lib/supabase/server"
import { generateGameCode } from "@/lib/game/code-generator"
import { NextResponse } from "next/server"

// POST /api/library/[itemId]/clone — clone library item into a new game
export async function POST(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neprisijungęs" }, { status: 401 })
    }

    // Get library item
    const { data: item, error: itemError } = await supabase
      .from("library_items")
      .select("*")
      .eq("id", params.itemId)
      .eq("status", "approved")
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Šablonas nerastas arba nepatvirtintas" },
        { status: 404 }
      )
    }

    // Create new game
    const gameCode = generateGameCode()
    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        teacher_id: user.id,
        title: `${item.title} (kopija)`,
        description: item.description,
        game_code: gameCode,
        status: "draft",
        settings: item.settings || {
          max_teams: 50,
          time_limit_minutes: null,
          show_leaderboard: true,
          shuffle_challenges: false,
        },
      })
      .select()
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: gameError?.message || "Nepavyko sukurti žaidimo" },
        { status: 500 }
      )
    }

    // Create challenges from snapshot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const challengeData = item.challenge_data as any[]
    if (challengeData && challengeData.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const challenges = challengeData.map((c: any) => ({
        game_id: game.id,
        title: c.title,
        description: c.description || "",
        type: c.type || "text",
        points: c.points || 100,
        answer_hash: "", // Teacher needs to fill in answers
        hints: c.hints || [],
        options: c.options || null,
        order_index: c.order_index || 0,
        image_url: c.image_url || null,
        maps_url: c.maps_url || null,
      }))

      const { error: challengeError } = await supabase
        .from("challenges")
        .insert(challenges)

      if (challengeError) {
        // Game was created but challenges failed — still return the game
        console.error("Challenge clone error:", challengeError)
      }
    }

    // Increment clone count (best effort)
    await supabase
      .from("library_items")
      .update({ clone_count: (item.clone_count || 0) + 1 })
      .eq("id", params.itemId)

    return NextResponse.json(
      { game_id: game.id, game_code: game.game_code },
      { status: 201 }
    )
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vidinė klaida" }, { status: 500 })
  }
}
