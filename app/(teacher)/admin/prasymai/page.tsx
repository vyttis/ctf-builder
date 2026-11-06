import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/roles"
import { Button } from "@/components/ui/button"
import { AccessRequestsPanel } from "@/components/admin/access-requests-panel"
import { RequestLinksPanel } from "@/components/admin/request-links-panel"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = { title: "Paskyrų prašymai | KU STEAM pamokos" }

// Only the super admin decides on accounts.
export default async function AccessRequestsPage() {
  const supabase = await createClient()
  if ((await getUserRole(supabase)) !== "super_admin") redirect("/admin")

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="mb-4 inline-block">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Administravimas
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-steam-dark">Paskyrų prašymai</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vedėjo paskyrą gauna tik jūsų patvirtinti mokytojai. Viešos registracijos nėra.
        </p>
      </div>
      <AccessRequestsPanel />
      <RequestLinksPanel />
    </div>
  )
}
