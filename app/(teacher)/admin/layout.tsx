import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { getUserProfile, canViewAdminDashboard } from "@/lib/auth/roles"
import { AdminNav } from "@/components/admin/admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)

  if (!profile || !canViewAdminDashboard(profile.role)) {
    redirect("/dashboard")
  }

  // Templates waiting for a decision, shown on "Moderavimas".
  const { count: pendingTemplates } = await createAdminClient()
    .from("library_items")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_review")

  return (
    <>
      <AdminNav superAdmin={profile.role === "super_admin"} pendingTemplates={pendingTemplates ?? 0} />
      {children}
    </>
  )
}
