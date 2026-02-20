"use client"

import { SteamLogo } from "@/components/steam-logo"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Plus, LayoutDashboard, BookOpen, Shield } from "lucide-react"
import Link from "next/link"
import { UserRole } from "@/types/game"
import { canViewAdminDashboard } from "@/lib/auth/roles"

interface TeacherNavProps {
  email: string
  fullName: string
  role?: UserRole
  avatarUrl?: string | null
}

export function TeacherNav({ email, fullName, role = "teacher", avatarUrl }: TeacherNavProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl bg-white/80">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center shrink-0">
              <SteamLogo size="small" />
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-steam-dark gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Žaidimai
                </Button>
              </Link>
              <Link href="/library">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-steam-dark gap-2">
                  <BookOpen className="h-4 w-4" />
                  Biblioteka
                </Button>
              </Link>
              {canViewAdminDashboard(role) && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-steam-dark gap-2">
                    <Shield className="h-4 w-4" />
                    Administravimas
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/games/new">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Naujas žaidimas</span>
              </Button>
            </Link>

            <div className="hidden sm:flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : null}
              <div className="text-right">
                <p className="text-sm font-medium text-steam-dark leading-none">
                  {fullName || email}
                </p>
                {fullName && (
                  <p className="text-xs text-muted-foreground">{email}</p>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
