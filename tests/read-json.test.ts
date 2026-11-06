import { describe, expect, it } from "vitest"
import { messageForStatus, readJson } from "@/lib/http/read-json"

describe("readJson", () => {
  it("returns the JSON body", async () => {
    const res = new Response(JSON.stringify({ url: "x" }), { status: 200 })
    expect(await readJson<{ url: string }>(res)).toEqual({ url: "x" })
  })

  it("turns a non-JSON page into a Lithuanian message for its status", async () => {
    const tooLarge = new Response("<html>Request Entity Too Large</html>", { status: 413 })
    expect((await readJson(tooLarge)).error).toBe("Failas per didelis. Didžiausias dydis 4 MB.")
    const gateway = new Response("An error occurred", { status: 504 })
    expect((await readJson(gateway)).error).toMatch(/neatsakė laiku/)
  })

  it("has a message for every status", () => {
    for (const status of [400, 401, 403, 404, 413, 429, 500, 502, 504]) {
      expect(messageForStatus(status)).not.toMatch(/[a-z]+ [a-z]+ error/i)
    }
  })
})
