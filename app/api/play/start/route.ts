import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { z } from "zod"

// POST /api/play/start — stamp the team's timed-run start, once.
//
// The player time limit is enforced server-side against teams.started_at
// (/api/submissions). The client calls this when the team taps "Pradėti" (and
// on reload of an already-started timed game) so the deadline is anchored on a
// server timestamp the student can't tamper with. Idempotent: started_at is
// only set while NULL, so repeated calls never reset the clock.
const startSchema = z.object({
  session_token: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Netinkamas užklausos formatas" }, { status: 400 })
    }

    const parsed = startSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Neteisingi duomenys" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Only stamp while NULL — never reset an already-running clock.
    const { data: updated, error } = await supabase
      .from("teams")
      .update({ started_at: new Date().toISOString() })
      .eq("session_token", parsed.data.session_token)
      .is("started_at", null)
      .select("started_at")
      .maybeSingle()

    if (error) {
      // Column missing (migration 00023 not applied yet) — degrade gracefully
      // so the client falls back to its localStorage clock.
      if (error.code === "42703") {
        return NextResponse.json({ started_at: null })
      }
      console.error("play/start error:", error.message)
      return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
    }

    // updated is null when started_at was already set (the .is filter matched
    // no row) — read the existing value so the client gets the authoritative
    // start either way.
    if (updated?.started_at) {
      return NextResponse.json({ started_at: updated.started_at })
    }

    const { data: existing } = await supabase
      .from("teams")
      .select("started_at")
      .eq("session_token", parsed.data.session_token)
      .maybeSingle()

    return NextResponse.json({ started_at: existing?.started_at ?? null })
  } catch (err) {
    console.error("play/start exception:", err)
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }
}
