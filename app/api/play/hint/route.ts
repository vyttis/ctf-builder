import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { z } from "zod"

// POST /api/play/hint — record that a team revealed a hint and return its
// text. The play state sends only hints the team already opened, so this is
// the one way to read a hint, and reading it always records the penalty.
//
// The hint penalty in /api/submissions is computed from these rows, not from a
// client-declared count, so a student can no longer reveal hints and then
// claim they used none. Idempotent per (team, challenge, hint_index) via the
// unique constraint (00024).
const hintSchema = z.object({
  session_token: z.string().min(1),
  challenge_id: z.string().uuid(),
  hint_index: z.number().int().min(0).max(20),
})

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Netinkamas užklausos formatas" }, { status: 400 })
    }

    const parsed = hintSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Neteisingi duomenys" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: team } = await supabase
      .from("teams")
      .select("id, game_id")
      .eq("session_token", parsed.data.session_token)
      .maybeSingle()

    if (!team) {
      return NextResponse.json(
        { error: "Sesija nerasta. Prisijunkite iš naujo." },
        { status: 401 }
      )
    }

    // The challenge must belong to the team's game, and the hint index must
    // exist — otherwise a client could inflate any team's penalty.
    const { data: challenge } = await supabase
      .from("challenges")
      .select("id, game_id, hints")
      .eq("id", parsed.data.challenge_id)
      .maybeSingle()

    if (!challenge || challenge.game_id !== team.game_id) {
      return NextResponse.json({ error: "Užduotis nerasta" }, { status: 404 })
    }

    const hints: unknown[] = Array.isArray(challenge.hints) ? challenge.hints : []
    const hint = hints[parsed.data.hint_index]
    if (typeof hint !== "string") {
      return NextResponse.json({ error: "Tokios užuominos nėra" }, { status: 400 })
    }

    const { error: insertError } = await supabase.from("hint_reveals").insert({
      team_id: team.id,
      challenge_id: parsed.data.challenge_id,
      hint_index: parsed.data.hint_index,
    })

    // 23505 = already revealed (idempotent). 42P01 = table missing (migration
    // 00024 not applied) — degrade gracefully; the submission API then falls
    // back to the client-declared hint count.
    if (insertError && insertError.code !== "23505") {
      if (insertError.code === "42P01") {
        return NextResponse.json({ ok: false, tracked: false, hint })
      }
      console.error("hint reveal insert failed:", insertError.message)
      return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, tracked: true, hint })
  } catch (err) {
    console.error("play/hint exception:", err)
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }
}
