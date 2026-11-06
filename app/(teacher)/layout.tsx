import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { TeacherNav } from "@/components/teacher/teacher-nav"
import { TeacherErrorBoundary } from "@/components/teacher/teacher-error-boundary"

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: profile }, { data: liveGames }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    // Cheap indexed lookup for the nav LIVE shortcut; refreshed on every
    // navigation (status changes call router.refresh())
    supabase
      .from("games")
      .select("id, title, status")
      .eq("teacher_id", user.id)
      .in("status", ["active", "paused"])
      // "active" sorts before "paused": a running game wins over any number
      // of more recently updated paused ones
      .order("status", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(1),
  ])

  const liveGame = liveGames?.[0] ?? null

  // Account requests are server-only data; the count is read with the
  // service role, and only for the super admin who decides on them.
  let pendingRequests = 0
  if (profile?.role === "super_admin") {
    const { count } = await createAdminClient()
      .from("access_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
    pendingRequests = count ?? 0
  }

  return (
    <div className="min-h-screen bg-muted">
      <a
        href="#turinys"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-steam-dark focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Praleisti į turinį
      </a>
      <TeacherNav
        email={user.email || ""}
        fullName={profile?.full_name || ""}
        role={profile?.role || "teacher"}
        pendingRequests={pendingRequests}
        avatarUrl={profile?.avatar_url}
        activeGame={
          liveGame
            ? { id: liveGame.id, title: liveGame.title, paused: liveGame.status === "paused" }
            : null
        }
      />
      <main id="turinys" tabIndex={-1} className="container mx-auto px-4 py-6 max-w-6xl focus:outline-none">
        <TeacherErrorBoundary>{children}</TeacherErrorBoundary>
      </main>
    </div>
  )
}
