/**
 * Host roles for KU STEAM CLASSROOM.
 *
 * The canonical public address is pamokos.kusteam.app: one host for both the
 * facilitator area (/vedejui, /dashboard, ...) and the participant area
 * (/prisijungti, /play/<code>). The older split hosts app.* (facilitators)
 * and play.* (participants) stay served by the same deployment so existing
 * bookmarks and printed QR codes keep working; once CANONICAL_CLASSROOM_HOST
 * is set they redirect to the canonical host.
 */

export type HostKind = "app" | "play" | "pamokos" | "root"

export function hostKind(hostname: string): HostKind {
  const host = hostname.split(":")[0].toLowerCase()
  const parts = host.split(".")
  const isLocal = host === "localhost" || host.endsWith(".localhost")
  // app.kusteam.app -> "app"; app.localhost -> "app"; kusteam.app -> root
  const hasSubdomain = isLocal ? parts.length > 1 : parts.length > 2
  if (!hasSubdomain) return "root"
  switch (parts[0]) {
    case "app":
      return "app"
    case "play":
      return "play"
    case "pamokos":
      return "pamokos"
    default:
      return "root"
  }
}

/**
 * Paths a legacy host keeps serving itself after the switch:
 * - API calls from pages that were open before the switch carry cookies or
 *   localStorage tokens that only exist on the old host.
 * - /auth/callback on app.* exchanges a PKCE code whose verifier cookie is
 *   host-only, so it has to finish on the host where login started.
 * - A participant already inside a game keeps the session token in
 *   localStorage of play.*; moving them mid-game would lose their team.
 */
function servedInPlace(kind: "app" | "play", pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true
  if (kind === "app") return pathname === "/auth/callback"
  return /^\/play\/[^/]+\/(play|leaderboard)(\/|$)/.test(pathname)
}

/** Where an old path lives on the canonical host. */
function canonicalPath(kind: "app" | "play", pathname: string): string {
  if (kind === "app") {
    if (pathname === "/" || pathname === "/auth/login") return "/vedejui"
    return pathname
  }
  if (pathname === "/" || pathname === "/play" || pathname === "/play/") {
    return "/prisijungti"
  }
  return pathname
}

/**
 * The absolute URL a request on app.* or play.* should move to, or null when
 * it stays where it is. `search` is passed through untouched (it includes
 * the leading "?" when present).
 */
export function legacyRedirect(
  kind: HostKind,
  pathname: string,
  search: string,
  canonicalHost: string | undefined,
): string | null {
  if (!canonicalHost) return null
  if (kind !== "app" && kind !== "play") return null
  if (servedInPlace(kind, pathname)) return null
  return `https://${canonicalHost}${canonicalPath(kind, pathname)}${search}`
}
