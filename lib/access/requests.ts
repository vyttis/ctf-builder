import type { SupabaseClient } from "@supabase/supabase-js"
import { findSchoolByCode } from "@/lib/access/schools"
import { isValidActivityRequestToken } from "@/lib/access/tokens"
import type { z } from "zod"
import type { accessRequestSchema } from "@/lib/access/profile-fields"

type AccessRequestInput = z.infer<typeof accessRequestSchema>

/** A finished activity keeps accepting requests for two days. */
export const FINISHED_GRACE_MS = 48 * 60 * 60 * 1000

export type RequestSource =
  | { ok: true; source: "finish_screen" | "qr"; gameId: string; linkId: null }
  | { ok: true; source: "link"; gameId: null; linkId: string }
  | { ok: false; status: number; error: string }

const CLOSED = "Prašymų priėmimas šiai veiklai išjungtas arba baigėsi."

interface GameRow {
  id: string
  status: string
  updated_at: string
  settings: Record<string, unknown> | null
}

/** True while the activity accepts requests: the facilitator allowed it,
 *  and it runs, is paused, or finished less than two days ago. */
export function activityAcceptsRequests(game: GameRow, now = Date.now()): boolean {
  if (game.settings?.allow_access_requests !== true) return false
  if (game.status === "active" || game.status === "paused") return true
  if (game.status === "finished") {
    return now - new Date(game.updated_at).getTime() < FINISHED_GRACE_MS
  }
  return false
}

export interface LinkRow {
  id: string
  expires_at: string | null
  revoked_at: string | null
  max_uses: number | null
}

export function linkIsOpen(link: LinkRow, usedCount: number, now = Date.now()): boolean {
  if (link.revoked_at) return false
  if (link.expires_at && new Date(link.expires_at).getTime() <= now) return false
  if (link.max_uses !== null && usedCount >= link.max_uses) return false
  return true
}

/** Works out which door the request came through and whether it is open. */
export async function resolveRequestSource(
  admin: SupabaseClient,
  input: Pick<AccessRequestInput, "game_code" | "session_token" | "activity_token" | "link_token">,
): Promise<RequestSource> {
  if (input.link_token) {
    const { data: link } = await admin
      .from("request_links")
      .select("id, expires_at, revoked_at, max_uses")
      .eq("token", input.link_token)
      .maybeSingle()
    if (!link) return { ok: false, status: 404, error: "Nuoroda neteisinga." }
    const { count } = await admin
      .from("access_requests")
      .select("id", { count: "exact", head: true })
      .eq("source_link_id", link.id)
    if (!linkIsOpen(link, count ?? 0)) {
      return { ok: false, status: 410, error: "Ši nuoroda nebegalioja. Paprašykite naujos." }
    }
    return { ok: true, source: "link", gameId: null, linkId: link.id }
  }

  if (!input.game_code || (!input.session_token && !input.activity_token)) {
    return { ok: false, status: 400, error: "Trūksta veiklos duomenų." }
  }

  const { data: game } = await admin
    .from("games")
    .select("id, status, updated_at, settings")
    .eq("game_code", input.game_code)
    .maybeSingle()
  if (!game) return { ok: false, status: 404, error: "Veikla nerasta." }
  if (!activityAcceptsRequests(game)) return { ok: false, status: 403, error: CLOSED }

  if (input.session_token) {
    const { data: team } = await admin
      .from("teams")
      .select("id")
      .eq("session_token", input.session_token)
      .eq("game_id", game.id)
      .maybeSingle()
    if (!team) return { ok: false, status: 403, error: "Komandos sesija nerasta." }
    return { ok: true, source: "finish_screen", gameId: game.id, linkId: null }
  }

  if (!isValidActivityRequestToken(game.id, input.activity_token)) {
    return { ok: false, status: 403, error: "Nuoroda neteisinga." }
  }
  return { ok: true, source: "qr", gameId: game.id, linkId: null }
}

/**
 * Stores the request. A second request from the same email while one is
 * pending is treated as success, so the form never tells a stranger
 * whether an address is already waiting.
 */
export async function saveAccessRequest(
  admin: SupabaseClient,
  input: AccessRequestInput,
  source: Extract<RequestSource, { ok: true }>,
): Promise<{ ok: true; created: boolean } | { ok: false; error: string }> {
  const school = input.school_code ? findSchoolByCode(input.school_code) : null
  const { error } = await admin.from("access_requests").insert({
    email: input.email,
    first_name: input.first_name,
    last_name: input.last_name,
    school_code: school?.code ?? null,
    school_name: school?.name ?? input.school_name,
    municipality: school?.municipality ?? input.municipality ?? null,
    source: source.source,
    source_game_id: source.gameId,
    source_link_id: source.linkId,
  })
  if (error && error.code !== "23505") {
    console.error("[access-request] insert failed", { code: error.code })
    return { ok: false, error: "Nepavyko išsaugoti prašymo. Bandykite dar kartą." }
  }
  // 23505: this email already waits; same answer, but no second round of email.
  return { ok: true, created: !error }
}
