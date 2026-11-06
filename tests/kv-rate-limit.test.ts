import { describe, it, expect, vi, beforeEach } from "vitest"

const incr = vi.fn()
const expire = vi.fn()
const ctorOptions: unknown[] = []

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor(options: unknown) {
      ctorOptions.push(options)
    }
    incr = incr
    expire = expire
  },
}))

beforeEach(() => {
  vi.resetModules()
  incr.mockReset()
  expire.mockReset()
  ctorOptions.length = 0
  process.env.KV_REST_API_URL = "https://example.upstash.io"
  process.env.KV_REST_API_TOKEN = "test-token"
})

describe("incrAtomic", () => {
  it("counts through the store when it works", async () => {
    const { incrAtomic } = await import("@/lib/ai/kv-rate-limit")
    incr.mockResolvedValueOnce(1)
    await expect(incrAtomic("k", 60_000)).resolves.toBe(1)
    expect(expire).toHaveBeenCalledWith("k", 60)
  })

  it("makes one attempt with a timeout, never the slow default retries", async () => {
    const { incrAtomic } = await import("@/lib/ai/kv-rate-limit")
    incr.mockResolvedValueOnce(2)
    await incrAtomic("k", 60_000)
    expect(ctorOptions[0]).toMatchObject({ retry: false })
    expect(typeof (ctorOptions[0] as { signal: unknown }).signal).toBe("function")
  })

  it("skips an unreachable store after the first failure", async () => {
    const { incrAtomic } = await import("@/lib/ai/kv-rate-limit")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    incr.mockRejectedValueOnce(new TypeError("fetch failed"))
    await expect(incrAtomic("k", 60_000)).resolves.toBeNull()
    await expect(incrAtomic("k", 60_000)).resolves.toBeNull()
    expect(incr).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
