import type { SupabaseClient } from "@supabase/supabase-js"
import type { TeamStart } from "@/lib/game/player-hints"

/**
 * Starts a team's clock if it has none yet and returns the stored start.
 * The update is conditional (started_at IS NULL), so a start already made by
 * "Pradėti" or another device is never moved; the database stamps the pause
 * offset (teams_pause_offset trigger). Server only (service role).
 */
export async function startTeamClock(supabase: SupabaseClient, teamId: string): Promise<TeamStart> {
  const { data: stamped } = await supabase
    .from("teams")
    .update({ started_at: new Date().toISOString() })
    .eq("id", teamId)
    .is("started_at", null)
    .select("started_at, pause_offset_ms")
    .maybeSingle()
  const current =
    stamped ?? (await supabase.from("teams").select("started_at, pause_offset_ms").eq("id", teamId).maybeSingle()).data
  return {
    startedAt: (current?.started_at as string | null | undefined) ?? null,
    pauseOffsetMs: Number(current?.pause_offset_ms ?? 0) || 0,
  }
}
