import { describe, expect, it } from "vitest"
import { hostKind, legacyRedirect } from "@/lib/hosts"

const CANON = "pamokos.kusteam.app"

describe("hostKind", () => {
  it.each([
    ["app.kusteam.app", "app"],
    ["play.kusteam.app", "play"],
    ["pamokos.kusteam.app", "pamokos"],
    ["kusteam.app", "root"],
    ["www.kusteam.app", "root"],
    ["ctf-builder.vercel.app", "root"],
    ["app.localhost:3000", "app"],
    ["pamokos.localhost:3000", "pamokos"],
    ["localhost:3000", "root"],
  ])("%s is %s", (host, kind) => {
    expect(hostKind(host)).toBe(kind)
  })
})

describe("legacyRedirect", () => {
  it("does nothing until the canonical host is configured", () => {
    expect(legacyRedirect("app", "/dashboard", "", undefined)).toBeNull()
    expect(legacyRedirect("play", "/play/ABC123", "", undefined)).toBeNull()
  })

  it("never moves the canonical or root host", () => {
    expect(legacyRedirect("pamokos", "/dashboard", "", CANON)).toBeNull()
    expect(legacyRedirect("root", "/", "", CANON)).toBeNull()
  })

  it("keeps facilitator paths and query strings", () => {
    expect(legacyRedirect("app", "/games/42/builder", "?tab=ai", CANON)).toBe(
      "https://pamokos.kusteam.app/games/42/builder?tab=ai",
    )
    expect(legacyRedirect("app", "/", "", CANON)).toBe("https://pamokos.kusteam.app/vedejui")
    expect(legacyRedirect("app", "/auth/login", "?error=x", CANON)).toBe(
      "https://pamokos.kusteam.app/vedejui?error=x",
    )
  })

  it("sends old QR codes and the code entry screen to the participant entry", () => {
    expect(legacyRedirect("play", "/play/ABC123", "", CANON)).toBe(
      "https://pamokos.kusteam.app/play/ABC123",
    )
    expect(legacyRedirect("app", "/play/ABC123", "", CANON)).toBe(
      "https://pamokos.kusteam.app/play/ABC123",
    )
    expect(legacyRedirect("play", "/", "", CANON)).toBe("https://pamokos.kusteam.app/prisijungti")
    expect(legacyRedirect("play", "/play", "", CANON)).toBe("https://pamokos.kusteam.app/prisijungti")
  })

  it("leaves sessions that only exist on the old host alone", () => {
    expect(legacyRedirect("app", "/auth/callback", "?code=1", CANON)).toBeNull()
    expect(legacyRedirect("app", "/api/games", "", CANON)).toBeNull()
    expect(legacyRedirect("play", "/api/submissions", "", CANON)).toBeNull()
    expect(legacyRedirect("play", "/play/ABC123/play", "", CANON)).toBeNull()
    expect(legacyRedirect("play", "/play/ABC123/leaderboard", "", CANON)).toBeNull()
  })
})
