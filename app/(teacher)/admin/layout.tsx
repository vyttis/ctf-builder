import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserProfile, canViewAdminDashboard } from "@/lib/auth/roles"

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

  return <>{children}</>
}
