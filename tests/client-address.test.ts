import { afterEach, describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { clientAddress, clientKey } from "@/lib/client-address"

const request = (headers: Record<string, string>) => new Request("https://pamokos.kusteam.app/api/teams", { headers })

// Headers a client can send itself. On Vercel x-forwarded-for is overwritten
// by the platform; these others are not read at all.
const spoofed = (i: number) => ({
  "x-real-ip": `10.0.0.${i}`,
  "x-client-ip": `10.0.1.${i}`,
  "true-client-ip": `10.0.2.${i}`,
  "cf-connecting-ip": `10.0.3.${i}`,
  forwarded: `for=10.0.4.${i}`,
})

const original = process.env.SUPABASE_SERVICE_ROLE_KEY
afterEach(() => {
  if (original === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
  else process.env.SUPABASE_SERVICE_ROLE_KEY = original
})

describe("client address for rate limits", () => {
  it("uses only the first x-forwarded-for entry and ignores other client headers", () => {
    expect(clientAddress(request({ "x-forwarded-for": " 203.0.113.9 , 10.1.1.1" }))).toBe("203.0.113.9")
    expect(clientAddress(request({ "x-forwarded-for": "203.0.113.9", ...spoofed(1) }))).toBe("203.0.113.9")
    expect(clientAddress(request(spoofed(2)))).toBe("unknown")
  })

  it("gives rate limits a keyed hash, never the address", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-service-role-key"
    const key = clientKey(request({ "x-forwarded-for": "203.0.113.9" }))
    expect(key).toMatch(/^[0-9a-f]{32}$/)
    expect(key).not.toContain("203.0.113.9")
    expect(key).not.toBe(createHash("sha256").update("rate-limit:203.0.113.9").digest("hex").slice(0, 32))
    expect(clientKey(request({ "x-forwarded-for": "203.0.113.9, 10.9.9.9", ...spoofed(3) }))).toBe(key)
    expect(clientKey(request({ "x-forwarded-for": "203.0.113.10" }))).not.toBe(key)
    process.env.SUPABASE_SERVICE_ROLE_KEY = "another-test-only-key"
    expect(clientKey(request({ "x-forwarded-for": "203.0.113.9" }))).not.toBe(key)
  })

  it("still hashes without a server key (local development)", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const key = clientKey(request({ "x-forwarded-for": "203.0.113.9" }))
    expect(key).not.toContain("203.0.113.9")
    expect(key).toMatch(/^[0-9a-f]{32}$/)
  })
})
