import { createHmac, timingSafeEqual } from "node:crypto"

/** How long a rejoin link works after the facilitator shows it. */
export const REJOIN_TTL_MS = 10 * 60 * 1000

function key(): Buffer {
  const secret = process.env.REJOIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error("no server secret for rejoin links")
  // A key of its own, derived from the server secret, so a rejoin signature
  // can never stand in for anything else signed with that secret.
  return createHmac("sha256", secret).update("kusteam-classroom:rejoin:v1").digest()
}

function sign(payload: string): string {
  return createHmac("sha256", key()).update(payload).digest("base64url")
}

/**
 * A short-lived link token that lets a team's new device take over its
 * session: "<teamId>.<expiry ms>.<signature>". It carries no session token,
 * so a photo of the QR is useless after ten minutes, and the server still
 * checks that the team and its running activity exist when it is used.
 */
export function createRejoinToken(teamId: string, now = Date.now()): { token: string; expiresAt: number } {
  const expiresAt = now + REJOIN_TTL_MS
  const payload = `${teamId}.${expiresAt}`
  return { token: `${payload}.${sign(payload)}`, expiresAt }
}

export type RejoinCheck = { ok: true; teamId: string } | { ok: false; reason: "invalid" | "expired" }

export function verifyRejoinToken(token: string, now = Date.now()): RejoinCheck {
  const parts = token.split(".")
  if (parts.length !== 3) return { ok: false, reason: "invalid" }
  const [teamId, exp, signature] = parts
  if (!/^[0-9a-f-]{36}$/i.test(teamId) || !/^\d{13}$/.test(exp)) return { ok: false, reason: "invalid" }
  const expected = Buffer.from(sign(`${teamId}.${exp}`))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "invalid" }
  if (Number(exp) < now) return { ok: false, reason: "expired" }
  return { ok: true, teamId }
}
