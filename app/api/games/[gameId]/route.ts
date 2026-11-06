import { createClient } from "@/lib/supabase/server"
import { rpcRow } from "@/lib/supabase/rpc-row"
import { NextResponse } from "next/server"
import { z } from "zod"

// Safe columns to return for challenges (never include answer_hash)
const SAFE_CHALLENGE_SELECT = "id, game_id, title, description, type, points, hints, options, order_index, image_url, maps_url, created_at, updated_at"

const updateGameSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "finished"]).optional(),
  settings: z
    .object({
      max_teams: z.number().min(2).max(100).optional(),
      time_limit_minutes: z.number().nullable().optional(),
      show_leaderboard: z.boolean().optional(),
      shuffle_challenges: z.boolean().optional(),
      challenge_path_mode: z.enum(["linear", "free"]).optional(),
      allow_access_requests: z.boolean().optional(),
    })
    .optional(),
})

export async function GET(_request: Request, props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("games")
    .select(`*, challenges(${SAFE_CHALLENGE_SELECT})`)
    .eq("id", params.gameId)
    .eq("teacher_id", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Žaidimas nerastas" },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request, props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Netinkamas užklausos formatas" }, { status: 400 })
  }

  const parsed = updateGameSchema.safeParse(body)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Neteisingi duomenys"
    return NextResponse.json(
      { error: firstError },
      { status: 400 }
    )
  }

  const { data: current } = await supabase
    .from("games")
    .select("status")
    .eq("id", params.gameId)
    .eq("teacher_id", user.id)
    .maybeSingle()
  if (!current) {
    return NextResponse.json({ error: "Veikla nerasta" }, { status: 404 })
  }
  // Readiness is checked when the activity starts, not when it resumes: a
  // task added during a pause must not leave the activity stuck paused.
  if (parsed.data.status === "active" && current.status === "draft") {
    const { count } = await supabase
      .from("challenges")
      .select("id", { count: "exact", head: true })
      .eq("game_id", params.gameId)

    if (!count || count === 0) {
      return NextResponse.json(
        { error: "Veikla turi turėti bent 1 užduotį" },
        { status: 400 }
      )
    }

    // Block activation while duplicated/cloned challenges lack a real answer.
    // Tolerate a missing needs_answer column (unmigrated DB) by skipping.
    const { data: pendingTasks, error: pendingError } = await supabase
      .from("challenges")
      .select("id, title")
      .eq("game_id", params.gameId)
      .eq("needs_answer", true)
      .order("order_index", { ascending: true })

    if (!pendingError && pendingTasks && pendingTasks.length > 0) {
      const titles = pendingTasks.map((t) => `„${t.title}“`).join(", ")
      return NextResponse.json(
        {
          error: `Šios užduotys neturi nustatyto atsakymo: ${titles}. Nustatykite atsakymus prieš pradėdami veiklą.`,
          tasks_needing_answer: pendingTasks,
        },
        { status: 400 }
      )
    }
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description

  if (Object.keys(updateData).length === 0 && !parsed.data.settings && parsed.data.status === undefined) {
    return NextResponse.json({ error: "Nėra ką atnaujinti" }, { status: 400 })
  }

  let data: unknown = null
  if (Object.keys(updateData).length > 0) {
    const { data: updated, error } = await supabase
      .from("games")
      .update(updateData)
      .eq("id", params.gameId)
      .eq("teacher_id", user.id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: "Nepavyko išsaugoti veiklos." }, { status: 500 })
    }
    data = updated
  }

  // Settings merge in the database in one statement, so a save from an
  // older tab cannot undo an extension made meanwhile; while the activity
  // runs, the time limit changes only through "Pratęsti" (/extend).
  if (parsed.data.settings) {
    const { data: updated, error } = await supabase.rpc("update_game_settings", {
      p_game_id: params.gameId,
      p_patch: parsed.data.settings,
    })
    if (error) {
      if (error.code === "P0002") return NextResponse.json({ error: "Veikla nerasta" }, { status: 404 })
      return NextResponse.json({ error: "Nepavyko išsaugoti nustatymų." }, { status: 500 })
    }
    data = rpcRow(updated)
  }

  // Status moves only forward (draft -> active <-> paused -> finished); the
  // database function also keeps the pause time and the class start.
  if (parsed.data.status !== undefined) {
    const { data: updated, error } = await supabase.rpc("set_game_status", {
      p_game_id: params.gameId,
      p_status: parsed.data.status,
    })
    if (error) {
      if (error.code === "KS409") {
        return NextResponse.json(
          {
            error:
              current.status === "finished"
                ? "Veikla jau baigta, jos atnaujinti negalima."
                : "Šios būsenos pakeisti negalima. Atnaujinkite puslapį.",
            code: "status_conflict",
          },
          { status: 409 }
        )
      }
      if (error.code === "P0002") {
        return NextResponse.json({ error: "Veikla nerasta" }, { status: 404 })
      }
      return NextResponse.json({ error: "Nepavyko pakeisti būsenos." }, { status: 500 })
    }
    data = rpcRow(updated)
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: Request, props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", params.gameId)
    .eq("teacher_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
