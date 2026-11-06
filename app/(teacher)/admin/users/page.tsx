import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserProfile, requireRole } from "@/lib/auth/roles"
import { loadAdminUsers } from "@/lib/admin/users"
import { loadAiSettings } from "@/lib/ai/usage"
import { UsersManager } from "@/components/admin/users-manager"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Vartotojai" }

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const supabase = await createClient()
  try {
    await requireRole(supabase, "admin", "super_admin")
  } catch {
    redirect("/dashboard")
  }
  const profile = await getUserProfile(supabase)

  // Read with the service role after the role check above: last sign-in
  // comes from Auth, activity counts from every facilitator's games.
  // DI use and limits are for super administrators only (as on /admin/di).
  const admin = createAdminClient()
  const withAi = profile?.role === "super_admin"
  const [users, settings] = await Promise.all([
    loadAdminUsers(admin, { withAi }),
    withAi ? loadAiSettings(admin) : Promise.resolve(null),
  ])

  return (
    <div>
      <Link href="/admin" className="mb-6 inline-block">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Administravimas
        </Button>
      </Link>
      <UsersManager
        users={users}
        currentUserId={profile?.id ?? ""}
        currentUserRole={profile?.role ?? "teacher"}
        defaultAiLimit={settings?.ai_user_monthly_limit ?? 0}
      />
    </div>
  )
}
