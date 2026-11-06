import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { activityAcceptsRequests } from "@/lib/access/requests"
import { isValidActivityRequestToken } from "@/lib/access/tokens"
import { AccessRequestForm } from "@/components/access/access-request-form"
import { RequestPageShell } from "@/components/access/request-page-shell"

export const metadata: Metadata = {
  title: "Vedėjo paskyros prašymas | KU STEAM pamokos",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

// Opened from the QR on the class screen. Without the activity's signed
// token the page does not exist, so there is no public sign-up form.
export default async function ActivityRequestPage(props: {
  params: Promise<{ gameCode: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { gameCode } = await props.params
  const { t } = await props.searchParams
  const code = gameCode.toUpperCase()
  if (!/^[A-Z0-9]{6}$/.test(code) || !t) notFound()

  const admin = createAdminClient()
  const { data: game } = await admin
    .from("games")
    .select("id, title, status, updated_at, finished_at, settings")
    .eq("game_code", code)
    .maybeSingle()
  if (!game || !isValidActivityRequestToken(game.id, t)) notFound()

  if (!activityAcceptsRequests(game)) {
    return (
      <RequestPageShell title="Prašymų priėmimas baigėsi">
        <p className="text-sm text-muted-foreground">
          Šios veiklos prašymų priėmimas išjungtas arba baigėsi. Jei norite vedėjo paskyros, parašykite steam@ku.lt.
        </p>
      </RequestPageShell>
    )
  }

  return (
    <RequestPageShell title="Vedėjo paskyros prašymas" context={`Veikla „${game.title}“`}>
      <AccessRequestForm door={{ game_code: code, activity_token: t }} />
    </RequestPageShell>
  )
}
