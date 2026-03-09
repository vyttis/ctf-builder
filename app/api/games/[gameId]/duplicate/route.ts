import { createClient } from "@/lib/supabase/server"
import { generateGameCode } from "@/lib/game/code-generator"
import { NextResponse } from "next/server"
import { z } from "zod"

const duplicateSchema = z.object({
  title: z.string().min(3, "Pavadinimas turi būti bent 3 simbolių").optional(),
})

// POST /api/games/[gameId]/duplicate — duplicate a game with all challenges
export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Neprisijungęs" },
        { status: 401 }
      )
    }

    // Parse and validate body
    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is valid (title is optional)
    }
    const parsed = duplicateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
        { status: 400 }
      )
    }

    // Fetch source game (verify ownership)
    const { data: sourceGame, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", params.gameId)
      .eq("teacher_id", user.id)
      .single()

    if (gameError || !sourceGame) {
      return NextResponse.json(
        { error: "Žaidimas nerastas arba neturite teisės jį dubliuoti" },
        { status: 404 }
      )
    }

    // Fetch all challenges for this game (teacher has RLS access including answer_hash)
    const { data: sourceChallenges, error: challengesError } = await supabase
      .from("challenges")
      .select("*")
      .eq("game_id", sourceGame.id)
      .order("order_index", { ascending: true })

    if (challengesError) {
      return NextResponse.json(
        { error: "Nepavyko gauti užduočių: " + challengesError.message },
        { status: 500 }
      )
    }

    // Generate new game code
    const gameCode = generateGameCode()
    const newTitle = parsed.data?.title || `${sourceGame.title} (kopija)`

    // Insert new game
    const { data: newGame, error: newGameError } = await supabase
      .from("games")
      .insert({
        teacher_id: user.id,
        title: newTitle,
        description: sourceGame.description,
        game_code: gameCode,
        status: "draft" as const,
        settings: sourceGame.settings,
      })
      .select()
      .single()

    if (newGameError || !newGame) {
      return NextResponse.json(
        { error: newGameError?.message || "Nepavyko sukurti žaidimo kopijos" },
        { status: 500 }
      )
    }

    // Bulk insert challenges, then remap prerequisite UUIDs to new IDs
    if (sourceChallenges && sourceChallenges.length > 0) {
      const challengePayloads = sourceChallenges.map((c) => ({
        game_id: newGame.id,
        title: c.title,
        description: c.description,
        type: c.type,
        points: c.points,
        answer_hash: c.answer_hash,
        hints: c.hints,
        options: c.options,
        order_index: c.order_index,
        image_url: c.image_url,
        maps_url: c.maps_url,
        explanation: c.explanation,
        difficulty: c.difficulty,
        hint_penalty: c.hint_penalty,
        generated_by_di: c.generated_by_di,
        verification_verdict: c.verification_verdict,
        verification_issues: c.verification_issues,
        verification_confidence: c.verification_confidence,
        // Insert without prerequisites first, remap after
      }))

      const { data: newChallenges, error: insertError } = await supabase
        .from("challenges")
        .insert(challengePayloads)
        .select("id, order_index")

      if (insertError) {
        console.error("Challenge duplication error:", insertError)
        return NextResponse.json(
          { error: "Žaidimas sukurtas, bet nepavyko nukopijuoti užduočių: " + insertError.message, game_id: newGame.id },
          { status: 207 }
        )
      } else if (newChallenges) {
        // Build old ID → new ID mapping via order_index
        const newIdByIndex = new Map(newChallenges.map((c: { id: string; order_index: number }) => [c.order_index, c.id]))
        const idMap = new Map<string, string>()
        sourceChallenges.forEach((c) => {
          const newId = newIdByIndex.get(c.order_index)
          if (newId) idMap.set(c.id, newId)
        })

        // Update prerequisites with remapped IDs
        const hasPrereqs = sourceChallenges.some((c) => c.prerequisites?.length > 0)
        if (hasPrereqs) {
          const prereqResults = await Promise.all(
            sourceChallenges.map((src) => {
              if (!src.prerequisites?.length) return Promise.resolve(null)
              const newId = idMap.get(src.id)
              if (!newId) return Promise.resolve(null)
              const remapped = src.prerequisites
                .map((oldPrereqId: string) => idMap.get(oldPrereqId))
                .filter(Boolean) as string[]
              return supabase
                .from("challenges")
                .update({ prerequisites: remapped })
                .eq("id", newId)
            })
          )
          const prereqErrors = prereqResults.filter((r) => r?.error)
          if (prereqErrors.length > 0) {
            console.error("Prerequisite remapping errors:", prereqErrors)
          }
        }
      }
    }

    return NextResponse.json(
      { game_id: newGame.id, game_code: newGame.game_code },
      { status: 201 }
    )
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Vidinė serverio klaida",
      },
      { status: 500 }
    )
  }
}
