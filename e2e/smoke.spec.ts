import { expect, test } from "@playwright/test"

const TEACHER = process.env.TEACHER_URL || "https://app.kusteam.app"
const PLAY = process.env.PLAY_URL || "https://play.kusteam.app"

test.describe("students", () => {
  test("play root sends students to the code entry screen", async ({ page }) => {
    await page.goto(`${PLAY}/`)
    await expect(page).toHaveURL(/\/play$/)
    await expect(page.getByPlaceholder("KODAS")).toBeVisible()
    await expect(page.getByRole("button", { name: /Prisijungti/ })).toBeVisible()
  })

  test("an unknown code shows a clear message", async ({ page }) => {
    await page.goto(`${PLAY}/play`)
    await page.getByPlaceholder("KODAS").fill("ZZZZZZ")
    await page.getByPlaceholder("KODAS").press("Enter")
    await expect(page).toHaveURL(/\/play\/ZZZZZZ$/)
    await expect(page.getByText("Žaidimas nerastas")).toBeVisible()
  })

  test("old QR links on the teacher host bounce to the play host", async ({ request }) => {
    const res = await request.get(`${TEACHER}/play/ZZZZZZ`, { maxRedirects: 0 })
    expect([307, 308]).toContain(res.status())
    expect(res.headers()["location"]).toContain("play.")
  })

  test("the code entry screen has no horizontal overflow on phones", async ({ page }) => {
    await page.goto(`${PLAY}/play`)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe("teachers", () => {
  test("signed-out teachers land on the login screen", async ({ page }) => {
    await page.goto(`${TEACHER}/dashboard`)
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole("button", { name: /Google/ })).toBeVisible()
    await expect(page.getByRole("textbox")).toBeVisible()
  })

  test("health endpoint reports the database as reachable", async ({ request }) => {
    const res = await request.get(`${TEACHER}/api/health`)
    expect(res.status()).toBe(200)
    expect((await res.json()).status).toBe("ok")
  })
})
