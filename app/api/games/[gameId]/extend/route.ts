import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const extendSchema = z.object({ minutes: z.number().int().min(1).max(180) })

// POST /api/games/[gameId]/extend: add minutes to a running activity's time
// limit. The database adds them in one statement, so two devices pressing
// "Pratęsti" both count, and an activity without a limit gets no limit.
export async function POST(request: Request, props: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })

  const parsed = extendSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Nurodykite nuo 1 iki 180 minučių." }, { status: 400 })
  }

  const { data, error } = await supabase.rpc("extend_game_time", {
    p_game_id: gameId,
    p_minutes: parsed.data.minutes,
  })
  if (error) {
    if (error.code === "KS422") {
      return NextResponse.json(
        { error: "Ši veikla neturi laiko limito, todėl pratęsti nereikia." },
        { status: 400 }
      )
    }
    if (error.code === "KS409") {
      return NextResponse.json({ error: "Pratęsti galima tik vykstančią veiklą." }, { status: 409 })
    }
    if (error.code === "P0002") return NextResponse.json({ error: "Veikla nerasta" }, { status: 404 })
    return NextResponse.json({ error: "Nepavyko pratęsti laiko." }, { status: 500 })
  }

  const settings = (data as { settings?: { time_limit_minutes?: number } } | null)?.settings
  return NextResponse.json({ time_limit_minutes: settings?.time_limit_minutes ?? null })
}
