import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/roles"
import { Button } from "@/components/ui/button"
import { AiUsagePanel } from "@/components/admin/ai-usage-panel"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = { title: "DI naudojimas | KU STEAM pamokos" }

export default async function AiUsagePage() {
  const supabase = await createClient()
  if ((await getUserRole(supabase)) !== "super_admin") redirect("/admin")

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="mb-4 inline-block">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Administravimas
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-steam-dark">DI naudojimas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kiek kainuoja DI šį mėnesį ir kokie limitai saugo biudžetą.
        </p>
      </div>
      <AiUsagePanel />
    </div>
  )
}
