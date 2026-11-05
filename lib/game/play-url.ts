/**
 * Build the participant URL for an activity code.
 *
 * The canonical participant address is pamokos.kusteam.app/play/<code>: the
 * same host serves the facilitator area and the participant area. The path
 * keeps the /play/<code> shape because it matches app/play/[gameCode], so
 * QR codes printed before the move keep working through redirects.
 *
 * Priority:
 *   1. NEXT_PUBLIC_PLAY_URL (set per environment in Vercel; production:
 *      https://pamokos.kusteam.app)
 *   2. The facilitator's own origin when it is pamokos.* (or any host
 *      without the old app./play. split)
 *   3. Legacy split: swap `app.` for `play.` in the origin
 */
export function getPlayUrl(gameCode: string): string {
  const configured = process.env.NEXT_PUBLIC_PLAY_URL?.replace(/\/$/, "")
  if (configured) {
    return `${configured}/play/${gameCode}`
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin
    // app.kusteam.app -> play.kusteam.app, app.localhost:3000 -> play.localhost:3000
    const playOrigin = /\/\/app\./.test(origin)
      ? origin.replace(/\/\/app\./, "//play.")
      : origin
    return `${playOrigin}/play/${gameCode}`
  }
  return `/play/${gameCode}`
}
