import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Full-bleed dark layout for the projector "class screen" — no TeacherNav,
// no width container. Auth is still required (teacher-only view).
export default async function LiveLayout({
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

  return <div className="min-h-screen bg-steam-dark">{children}</div>
}
