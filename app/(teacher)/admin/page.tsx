import { createClient } from "@/lib/supabase/server"
import { StatsCards } from "@/components/admin/stats-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlatformStats, Profile } from "@/types/game"
import { getRoleLabel, getRoleBadgeColor } from "@/lib/auth/roles"
import {
  BarChart3,
  Users,
  BookOpen,
  ArrowRight,
  Clock,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface PendingLibraryItem {
  id: string
  title: string
  subject: string | null
  grade_level: string | null
  challenge_count: number
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch stats, recent users, and pending library items in parallel
  // (was 3 sequential queries → 3x faster cold start)
  const [statsRes, recentUsersRes, pendingItemsRes] = await Promise.all([
    supabase.rpc("get_platform_stats"),
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("library_items")
      .select("*, profiles!library_items_published_by_fkey(full_name, email)")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const stats = (statsRes.data as PlatformStats) || {
    total_games: 0,
    active_games: 0,
    total_teachers: 0,
    total_admins: 0,
    total_users: 0,
    total_teams: 0,
    total_submissions: 0,
    correct_submissions: 0,
    library_items_approved: 0,
    library_items_pending: 0,
  }
  const recentUsers = recentUsersRes.data
  const pendingItems = pendingItemsRes.data

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark">
            Administravimas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Platformos statistika ir valdymas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-steam-dark mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Platformos statistika
        </h2>
        <StatsCards stats={stats} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <Card className="border-border/50 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" />
              Naujausi vartotojai
            </CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Visi <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(recentUsers as Profile[] || []).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt="" width={32} height={32} className="rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {(user.full_name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-steam-dark">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("lt-LT")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getRoleBadgeColor(user.role)}`}
                  >
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
              ))}
              {(!recentUsers || recentUsers.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nėra vartotojų
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending library items */}
        <Card className="border-border/50 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-highlight" />
              Laukia patvirtinimo
              {stats.library_items_pending > 0 && (
                <Badge className="bg-highlight/10 text-highlight border-highlight/20 text-xs">
                  {stats.library_items_pending}
                </Badge>
              )}
            </CardTitle>
            <Link href="/admin/library">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Visi <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {((pendingItems as PendingLibraryItem[] | null) || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-steam-dark">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.profiles?.full_name || item.profiles?.email || "—"}
                      {" · "}
                      {new Date(item.created_at).toLocaleDateString("lt-LT")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-highlight/10 text-highlight border-highlight/20 text-xs"
                  >
                    Laukia
                  </Badge>
                </div>
              ))}
              {(!pendingItems || pendingItems.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nėra laukiančių patvirtinimo
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
