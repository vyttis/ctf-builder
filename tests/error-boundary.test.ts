import { describe, expect, it } from "vitest"
import { isNextNavigationError } from "@/lib/navigation-errors"

describe("isNextNavigationError", () => {
  it("recognises notFound() and redirect() signals", () => {
    expect(isNextNavigationError({ digest: "NEXT_NOT_FOUND" })).toBe(true)
    expect(
      isNextNavigationError({ digest: "NEXT_REDIRECT;replace;/auth/login;307;" })
    ).toBe(true)
    expect(isNextNavigationError({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" })).toBe(true)
  })

  it("leaves real failures to the boundary", () => {
    expect(isNextNavigationError(new Error("boom"))).toBe(false)
    expect(isNextNavigationError({ digest: "2318734521" })).toBe(false)
    expect(isNextNavigationError(null)).toBe(false)
  })
})
