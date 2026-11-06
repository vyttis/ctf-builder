import { describe, it, expect } from "vitest"
import { friendlyAiError } from "@/lib/ai/error-message"

describe("friendlyAiError", () => {
  it("hides billing errors behind a fixed Lithuanian message", () => {
    const raw = new Error(
      '400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API."},"request_id":"req_x"}'
    )
    const msg = friendlyAiError(raw, "fallback")
    expect(msg).toContain("DI paslauga laikinai nepasiekiama")
    expect(msg).not.toContain("Anthropic")
    expect(msg).not.toContain("req_")
  })

  it("maps rate limits and overload", () => {
    expect(friendlyAiError(new Error("429 rate_limit_error"), "f")).toContain("perkrauta")
    expect(friendlyAiError(new Error("529 overloaded_error"), "f")).toContain("perkrauta")
  })

  it("falls back to the caller's message without echoing the raw error", () => {
    expect(friendlyAiError(new Error("socket hang up"), "Nepavyko.")).toBe("Nepavyko.")
  })
})
