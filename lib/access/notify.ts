import type { SupabaseClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/send"
import { newRequestEmail, requestReceivedEmail } from "@/lib/email/templates"
import { publicBaseUrl } from "@/lib/access/approve"
import type { RequestSource } from "@/lib/access/requests"

interface SavedRequest {
  email: string
  first_name: string
  last_name: string
  school_name: string | null
  municipality: string | null
}

/** Emails of the active super admins, who decide on requests. */
export async function superAdminEmails(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin.from("profiles").select("email").eq("role", "super_admin").eq("status", "active")
  return (data ?? []).map((r) => r.email).filter((e): e is string => Boolean(e))
}

async function sourceText(admin: SupabaseClient, source: Extract<RequestSource, { ok: true }>): Promise<string> {
  if (source.source === "link") {
    const { data } = await admin.from("request_links").select("label").eq("id", source.linkId).maybeSingle()
    return `Nuoroda „${data?.label ?? "be pavadinimo"}“`
  }
  const { data } = await admin.from("games").select("title, game_code").eq("id", source.gameId).maybeSingle()
  const activity = data ? `„${data.title}“ (${data.game_code})` : "veikla"
  return source.source === "qr" ? `Veiklos QR: ${activity}` : `Veiklos pabaiga: ${activity}`
}

/** After a new request: a receipt to the teacher and a notice to the super admins. */
export async function notifyNewRequest(
  admin: SupabaseClient,
  request: SavedRequest,
  source: Extract<RequestSource, { ok: true }>,
  origin: string,
): Promise<void> {
  const [admins, from, pending] = await Promise.all([
    superAdminEmails(admin),
    sourceText(admin, source),
    admin
      .from("access_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .then((r) => r.count ?? 1),
  ])
  await Promise.all([
    sendEmail(
      requestReceivedEmail(request.email, {
        first_name: request.first_name,
        last_name: request.last_name,
        email: request.email,
        school: request.school_name,
        municipality: request.municipality,
      }),
    ),
    admins.length > 0
      ? sendEmail(
          newRequestEmail(
            admins,
            {
              name: `${request.first_name} ${request.last_name}`,
              email: request.email,
              school: request.school_name,
              municipality: request.municipality,
              source: from,
              submittedAt: new Date(),
              pending,
            },
            `${publicBaseUrl(origin)}/admin/prasymai`,
          ),
        )
      : Promise.resolve(),
  ])
}
