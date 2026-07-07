/**
 * Build the player URL for a game code.
 *
 * The teacher is on the `app.*` subdomain. Player links must take students
 * to the `play.*` subdomain — otherwise middleware sees an unauthenticated
 * user on a teacher subdomain and redirects them to /auth/login (a
 * student-blocking dead end).
 *
 * The path always keeps the `/play/<code>` shape because that matches the
 * Next.js route `app/play/[gameCode]/page.tsx`, regardless of subdomain.
 *
 * Priority:
 *   1. NEXT_PUBLIC_PLAY_URL (configured per environment in Vercel)
 *   2. Swap `app.` → `play.` in window.location.origin
 *   3. Same-origin (localhost dev, no subdomain split)
 */
export function getPlayUrl(gameCode: string): string {
  const configured = process.env.NEXT_PUBLIC_PLAY_URL?.replace(/\/$/, "")
  if (configured) {
    return `${configured}/play/${gameCode}`
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin
    // app.kusteam.app → play.kusteam.app, app.localhost:3000 → play.localhost:3000
    const playOrigin = /\/\/app\./.test(origin)
      ? origin.replace(/\/\/app\./, "//play.")
      : origin
    return `${playOrigin}/play/${gameCode}`
  }
  return `/play/${gameCode}`
}
