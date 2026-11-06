import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/access/admin-guard"

const STATUSES = ["pending", "approved", "rejected"] as const

// GET /api/admin/access-requests?status=pending: newest first, with the
// activity or link the request came from.
export async function GET(request: Request) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response

  const param = new URL(request.url).searchParams.get("status") ?? "pending"
  const status = (STATUSES as readonly string[]).includes(param) ? param : "pending"

  const { data, error } = await guard.admin
    .from("access_requests")
    .select(
      "id, email, first_name, last_name, school_code, school_name, municipality, source, status, review_note, created_at, reviewed_at, games:source_game_id(title, game_code), request_links:source_link_id(label)",
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) {
    console.error("[admin/access-requests] list failed", { code: error.code })
    return NextResponse.json({ error: "Nepavyko gauti prašymų." }, { status: 500 })
  }

  // Flag emails that already have an account, so approving says what it does.
  const emails = (data ?? []).map((r) => r.email)
  const { data: accounts } = emails.length
    ? await guard.admin.from("profiles").select("email, status").in("email", emails)
    : { data: [] as { email: string; status: string }[] }
  const accountByEmail = new Map((accounts ?? []).map((a) => [a.email.toLowerCase(), a.status]))

  return NextResponse.json({
    requests: (data ?? []).map((r) => ({ ...r, account_status: accountByEmail.get(r.email) ?? null })),
  })
}
