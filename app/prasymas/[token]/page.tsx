import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { linkIsOpen } from "@/lib/access/requests"
import { looksLikeRequestLinkToken } from "@/lib/access/tokens"
import { AccessRequestForm } from "@/components/access/access-request-form"
import { RequestPageShell } from "@/components/access/request-page-shell"

export const metadata: Metadata = {
  title: "Vedėjo paskyros prašymas | KU STEAM pamokos",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

// A request link the super admin sent to teachers. Unknown tokens are a
// plain 404, so the address cannot be guessed into a sign-up form.
export default async function LinkRequestPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  if (!looksLikeRequestLinkToken(token)) notFound()

  const admin = createAdminClient()
  const { data: link } = await admin
    .from("request_links")
    .select("id, expires_at, revoked_at, max_uses")
    .eq("token", token)
    .maybeSingle()
  if (!link) notFound()

  const { count } = await admin
    .from("access_requests")
    .select("id", { count: "exact", head: true })
    .eq("source_link_id", link.id)

  if (!linkIsOpen(link, count ?? 0)) {
    return (
      <RequestPageShell title="Nuoroda nebegalioja">
        <p className="text-sm text-muted-foreground">
          Ši prašymo nuoroda pasibaigė arba buvo atšaukta. Paprašykite naujos nuorodos: steam@ku.lt.
        </p>
      </RequestPageShell>
    )
  }

  return (
    <RequestPageShell title="Vedėjo paskyros prašymas">
      <AccessRequestForm door={{ link_token: token }} />
    </RequestPageShell>
  )
}
