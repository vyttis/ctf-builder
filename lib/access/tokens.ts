import { createHmac, randomBytes, timingSafeEqual } from "crypto"

/**
 * Tokens for the closed sign-up.
 *
 * - Activity QR: an HMAC of the activity id, so the request page works only
 *   from the QR the facilitator shows. Nothing is stored; the key is the
 *   service role key, which never leaves the server. Rotating that key
 *   invalidates old QR codes, which is acceptable.
 * - Request link: a random token stored in request_links; the super admin
 *   sends the address to teachers and can revoke it.
 */

function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  return key
}

export function activityRequestToken(gameId: string, key: string = secret()): string {
  return createHmac("sha256", key).update(`access-request:${gameId}`).digest("base64url").slice(0, 22)
}

export function isValidActivityRequestToken(
  gameId: string,
  token: string | null | undefined,
  key: string = secret(),
): boolean {
  if (!token) return false
  const expected = Buffer.from(activityRequestToken(gameId, key))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export function newRequestLinkToken(): string {
  return randomBytes(18).toString("base64url")
}

/** Request link tokens are 24 URL-safe characters. */
export function looksLikeRequestLinkToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(token)
}
