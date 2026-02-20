import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/roles"
import { UserTable } from "@/components/admin/user-table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Profile } from "@/types/game"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div>
      <Link href="/admin" className="inline-block mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Administravimas
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark flex items-center gap-2">
            <Users className="h-6 w-6 text-secondary" />
            Vartotojai
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {(users || []).length} vartotojai platformoje
          </p>
        </div>
      </div>

      <Card className="border-border/50 bg-white">
        <CardContent className="p-0">
          <UserTable
            users={(users as Profile[]) || []}
            currentUserRole={profile?.role || "teacher"}
            currentUserId={profile?.id || ""}
          />
        </CardContent>
      </Card>
    </div>
  )
}
