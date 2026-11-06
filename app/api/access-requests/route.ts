import { NextResponse, after } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkAiRateLimitAsync } from "@/lib/ai/rate-limit"
import { accessRequestSchema } from "@/lib/access/profile-fields"
import { resolveRequestSource, saveAccessRequest } from "@/lib/access/requests"
import { clientIp } from "@/lib/access/admin-guard"
import { findSchoolByCode } from "@/lib/access/schools"
import { notifyNewRequest } from "@/lib/access/notify"

// POST /api/access-requests: a teacher asks for a facilitator account.
// Only through an open door: the finish screen of an activity that allows
// requests (team session), the activity QR (signed token), or a request
// link from the super admin. There is no public sign-up.
export async function POST(request: Request) {
  // A whole room of teachers often shares one school or venue Wi-Fi
  // address, so the limit is per address but generous.
  const ip = clientIp(request)
  if (!(await checkAiRateLimitAsync("access-request", ip, 40, 10 * 60_000))) {
    return NextResponse.json({ error: "Per daug bandymų. Palaukite kelias minutes." }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Netinkamas užklausos formatas." }, { status: 400 })
  }
  const parsed = accessRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Patikrinkite laukus." },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const source = await resolveRequestSource(admin, parsed.data)
  if (!source.ok) return NextResponse.json({ error: source.error }, { status: source.status })

  const saved = await saveAccessRequest(admin, parsed.data, source)
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status })

  if (saved.created) {
    const d = parsed.data
    const school = d.school_code ? findSchoolByCode(d.school_code) : null
    const origin = new URL(request.url).origin
    after(() =>
      notifyNewRequest(
        admin,
        {
          email: d.email,
          first_name: d.first_name,
          last_name: d.last_name,
          school_name: school?.name ?? d.school_name,
          municipality: school?.municipality ?? d.municipality ?? null,
        },
        source,
        origin,
      ),
    )
  }

  return NextResponse.json({ ok: true })
}
