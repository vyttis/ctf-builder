import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSuperAdmin } from "@/lib/access/admin-guard"
import { logAdminAction } from "@/lib/access/approve"
import { newRequestLinkToken } from "@/lib/access/tokens"

const createSchema = z.object({
  label: z.string().trim().min(2, "Įveskite pavadinimą").max(120),
  expires_in_days: z.number().int().min(1).max(365).nullable().optional(),
  max_uses: z.number().int().min(1).max(10000).nullable().optional(),
})

// GET /api/admin/request-links: all links with how many requests each got.
export async function GET() {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  const { data, error } = await guard.admin
    .from("request_links")
    .select("id, token, label, expires_at, revoked_at, max_uses, created_at, access_requests(count)")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: "Nepavyko gauti nuorodų." }, { status: 500 })
  return NextResponse.json({
    links: (data ?? []).map(({ access_requests, ...l }) => ({
      ...l,
      uses: (access_requests as { count: number }[] | null)?.[0]?.count ?? 0,
    })),
  })
}

// POST /api/admin/request-links: a new secret link to send to teachers.
export async function POST(request: Request) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Patikrinkite laukus." }, { status: 400 })
  }
  const days = parsed.data.expires_in_days ?? null
  const { data, error } = await guard.admin
    .from("request_links")
    .insert({
      token: newRequestLinkToken(),
      label: parsed.data.label,
      expires_at: days ? new Date(Date.now() + days * 86_400_000).toISOString() : null,
      max_uses: parsed.data.max_uses ?? null,
      created_by: guard.userId,
    })
    .select("id, token, label, expires_at, revoked_at, max_uses, created_at")
    .single()
  if (error || !data) return NextResponse.json({ error: "Nepavyko sukurti nuorodos." }, { status: 500 })
  await logAdminAction(guard.admin, guard.userId, "request_link.create", "request_link", data.id, {
    label: data.label,
  })
  return NextResponse.json({ link: { ...data, uses: 0 } }, { status: 201 })
}
