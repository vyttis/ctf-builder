import { createHash, createHmac } from "node:crypto"

/**
 * The client address as Vercel reports it. Vercel overwrites x-forwarded-for
 * with the address it received the request from and does not pass on values
 * sent by the client (https://vercel.com/docs/headers/request-headers), so the
 * first entry cannot be chosen by the client. Other headers a client can set
 * (x-real-ip from outside, forwarded, true-client-ip and the like) are ignored.
 * On any host that does not overwrite the header this must be revisited.
 */
export function clientAddress(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

/**
 * The key rate limits use for a client: a hash, so neither the in-memory map
 * nor KV ever holds an IP address. Keyed with a server-only secret when one is
 * set, so a stored key cannot be matched to an address by hashing all of IPv4.
 */
export function clientKey(request: Request): string {
  const address = clientAddress(request)
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  const digest = secret
    ? createHmac("sha256", secret).update(`rate-limit:${address}`)
    : createHash("sha256").update(`rate-limit:${address}`)
  return digest.digest("hex").slice(0, 32)
}
