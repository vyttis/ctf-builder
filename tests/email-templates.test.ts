import { afterEach, describe, expect, it, vi } from "vitest"
import {
  accountActivatedEmail,
  aiBudgetEmail,
  escapeHtml,
  newRequestEmail,
  requestReceivedEmail,
  requestRejectedEmail,
} from "@/lib/email/templates"
import { sendEmail } from "@/lib/email/send"

describe("email templates", () => {
  it("escapes form values in HTML but keeps them readable in text", () => {
    const m = requestReceivedEmail("ona@mokykla.lt", {
      first_name: "<b>Ona</b>",
      last_name: "Onaitė",
      email: "ona@mokykla.lt",
      school: "Klaipėdos „Ąžuolyno“ gimnazija",
      municipality: "Klaipėdos m.",
    })
    expect(m.html).not.toContain("<b>Ona</b>")
    expect(m.html).toContain("&lt;b&gt;Ona&lt;/b&gt;")
    expect(m.text).toContain("<b>Ona</b>")
    expect(m.subject).toBe("Gavome jūsų prašymą")
    expect(m.text).toContain("Mokykla: Klaipėdos „Ąžuolyno“ gimnazija, Klaipėdos m.")
    expect(m.html).toContain("/email/steam-logo.png")
  })

  it("gives the super admin the request and the review link", () => {
    const m = newRequestEmail(
      ["admin@ku.lt"],
      {
        name: "Ona Onaitė",
        email: "ona@mokykla.lt",
        school: "Klaipėdos „Ąžuolyno“ gimnazija",
        municipality: "Klaipėdos m.",
        source: "Veiklos QR",
        submittedAt: new Date("2026-11-06T11:05:00Z"),
        pending: 3,
      },
      "https://pamokos.kusteam.app/admin/prasymai",
    )
    expect(m.subject).toBe("Naujas paskyros prašymas: Ona Onaitė")
    expect(m.html).toContain('href="https://pamokos.kusteam.app/admin/prasymai"')
    expect(m.text).toContain("Mokykla: Klaipėdos „Ąžuolyno“ gimnazija")
    expect(m.text).toContain("Pateikta: 2026-11-06 13:05")
    expect(m.text).toContain("Iš viso laukia sprendimo: 3 prašymai.")
    expect(m.to).toEqual(["admin@ku.lt"])
  })

  it("keeps the rejection short and the activation actionable", () => {
    expect(requestRejectedEmail("a@b.lt", "Ona").text).toContain("steam@ku.lt")
    const a = accountActivatedEmail("a@b.lt", null, "https://pamokos.kusteam.app/vedejui")
    expect(a.text).toContain("Sveiki,\n")
    expect(a.text).toContain("Prisijungti: https://pamokos.kusteam.app/vedejui")
  })

  it("warns at 80 % and reports an exhausted budget", () => {
    const base = { budgetUsd: 50, monthGenitive: "lapkričio", resetsOn: "gruodžio 1 d.", top: [{ name: "Ona Onaitė", requests: 31, costUsd: 9.4 }] }
    const warn = aiBudgetEmail(["a@ku.lt"], { ...base, spentUsd: 40.12 }, "https://x.lt/admin/di")
    expect(warn.subject).toBe("DI biudžetas: išnaudota 80 % lapkričio sumos")
    expect(warn.text).toContain("40,12 USD iš 50,00 USD lapkričio mėnesiui")
    expect(warn.text).toContain("Ona Onaitė: 31 užklausa, 9,40 USD")
    const done = aiBudgetEmail(["a@ku.lt"], { ...base, spentUsd: 50.03 }, "https://x.lt/admin/di")
    expect(done.subject).toBe("DI biudžetas išnaudotas: DI funkcijos išjungtos iki gruodžio 1 d.")
    expect(done.text).toContain("Keisti biudžetą: https://x.lt/admin/di")
  })

  it("uses no long dashes in Lithuanian copy", () => {
    const r = { first_name: "Ona", last_name: "O", email: "a@b.lt", school: null, municipality: null }
    const all = [
      requestReceivedEmail("a@b.lt", r),
      requestRejectedEmail("a@b.lt", "Ona"),
      accountActivatedEmail("a@b.lt", "Ona", "https://x.lt"),
      newRequestEmail(["a@b.lt"], { name: "A B", email: "a@b.lt", school: null, municipality: null, source: "x", submittedAt: new Date(), pending: 1 }, "https://x.lt"),
      aiBudgetEmail(["a@b.lt"], { spentUsd: 41, budgetUsd: 50, monthGenitive: "lapkričio", resetsOn: "gruodžio 1 d.", top: [] }, "https://x.lt"),
    ]
    for (const m of all) expect(`${m.subject}${m.html}${m.text}`).not.toMatch(/[—–]/)
  })

  it("escapeHtml covers quotes", () => {
    expect(escapeHtml(`"a" & 'b'`)).toBe("&quot;a&quot; &amp; &#39;b&#39;")
  })
})

describe("sendEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("skips quietly without an API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(await sendEmail(requestRejectedEmail("a@b.lt", "Ona"))).toEqual({ ok: false, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(JSON.stringify(warn.mock.calls)).not.toContain("a@b.lt")
    warn.mockRestore()
  })

  it("posts to Resend and reports failures without the address", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test")
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 422 }))
    vi.stubGlobal("fetch", fetchMock)
    const err = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(await sendEmail(requestRejectedEmail("a@b.lt", "Ona"))).toEqual({ ok: false })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    const body = JSON.parse(init.body)
    expect(body.to).toEqual(["a@b.lt"])
    expect(body.reply_to).toBe("steam@ku.lt")
    expect(body.from).toContain("noreply@kusteam.app")
    expect(JSON.stringify(err.mock.calls)).not.toContain("a@b.lt")
    err.mockRestore()
  })
})
