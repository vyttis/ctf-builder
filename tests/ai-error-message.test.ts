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

describe("friendlyAiError does not match loose words", () => {
  it("keeps the caller's message when the model answered with a bad shape", () => {
    expect(friendlyAiError(new Error("Model returned no text block"), "Bandykite dar kartą.")).toBe("Bandykite dar kartą.")
  })

  it("does not read 'generate' as a rate limit", () => {
    expect(friendlyAiError(new Error("Failed to generate tasks"), "Nepavyko.")).toBe("Nepavyko.")
  })

  it("does not read digits inside a request id as a status code", () => {
    expect(friendlyAiError(new Error("500 server error request_id req_01x401y"), "Nepavyko.")).toBe("Nepavyko.")
  })

  it("maps a missing model", () => {
    const raw = new Error('404 {"type":"error","error":{"type":"not_found_error","message":"model: claude-x"}}')
    expect(friendlyAiError(raw, "f")).toContain("modelis")
  })

  it("maps an invalid key", () => {
    const raw = new Error('401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}')
    expect(friendlyAiError(raw, "f")).toContain("nepasiekiama")
  })
})
