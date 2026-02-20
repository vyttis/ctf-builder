import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TeacherNav } from "@/components/teacher/teacher-nav"

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <TeacherNav
        email={user.email || ""}
        fullName={profile?.full_name || ""}
        role={profile?.role || "teacher"}
        avatarUrl={profile?.avatar_url}
      />
      <main className="container mx-auto px-4 py-6 max-w-6xl">{children}</main>
    </div>
  )
}
