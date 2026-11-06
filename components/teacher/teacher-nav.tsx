"use client"

import { useState } from "react"
import { SteamLogo } from "@/components/steam-logo"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Gamepad2, GraduationCap, BookOpen, Shield, Menu } from "lucide-react"
import Link from "next/link"
import { UserRole } from "@/types/game"
import Image from "next/image"
import { canViewAdminDashboard } from "@/lib/auth/roles"

interface TeacherNavProps {
  email: string
  fullName: string
  role?: UserRole
  avatarUrl?: string | null
  // The teacher's currently running game (active/paused), if any — renders
  // a prominent LIVE shortcut to the class screen
  activeGame?: { id: string; title: string; paused?: boolean } | null
  /** Pending account requests (super admin only). */
  pendingRequests?: number
}

function PendingBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span
      className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-5 text-white"
      aria-label={`${count} nauji paskyrų prašymai`}
    >
      {count}
    </span>
  )
}

export function TeacherNav({
  email,
  fullName,
  role = "teacher",
  avatarUrl,
  activeGame = null,
  pendingRequests = 0,
}: TeacherNavProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl bg-white/80 print:hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center shrink-0">
              <SteamLogo size="small" />
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              <Link href="/lesson-plans">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-steam-dark gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Pamokų planai
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-steam-dark gap-2">
                  <Gamepad2 className="h-4 w-4" />
                  Mano veiklos
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
                    <PendingBadge count={pendingRequests} />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right side: min-w-0 lets the name and email truncate instead of
              running under the logout button when the LIVE badge is shown. */}
          <div className="flex min-w-0 items-center gap-3">
            {activeGame && (
              <Link
                href={`/games/${activeGame.id}/live`}
                className="hidden sm:block min-w-0"
                title={activeGame.title}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="max-w-full min-w-0 gap-2 border-accent/40 text-accent-ink hover:bg-accent/5 font-semibold"
                >
                  <LiveDot paused={activeGame.paused} />
                  <span className="truncate">{liveLabel(activeGame)}</span>
                </Button>
              </Link>
            )}
            <div className="hidden xl:flex min-w-0 items-center gap-3">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" width={32} height={32} className="shrink-0 rounded-full" />
              ) : null}
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-medium text-steam-dark leading-none">
                  {fullName || email}
                </p>
                {fullName && (
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              aria-label="Atsijungti"
              className="hidden lg:flex shrink-0 text-muted-foreground hover:text-accent-ink"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile hamburger menu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-muted-foreground"
              aria-label="Meniu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu dialog */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="lg:hidden top-0 translate-y-0 data-[state=open]:slide-in-from-top-2 max-w-full h-auto rounded-none border-0 border-b p-0">
          <DialogTitle className="sr-only">Navigacijos meniu</DialogTitle>
          <div className="p-4 space-y-1">
            {/* User info */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border/50">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" width={40} height={40} className="rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary-ink font-semibold">
                  {(fullName || email).charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-steam-dark">{fullName || email}</p>
                {fullName && <p className="text-xs text-muted-foreground">{email}</p>}
              </div>
            </div>

            {/* Live game shortcut */}
            {activeGame && (
              <Link href={`/games/${activeGame.id}/live`} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-11 border-accent/40 text-accent-ink font-semibold"
                >
                  <LiveDot paused={activeGame.paused} />
                  {liveLabel(activeGame)}
                </Button>
              </Link>
            )}

            {/* Nav links */}
            <Link href="/lesson-plans" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-steam-dark">
                <GraduationCap className="h-4 w-4" />
                Pamokų planai
              </Button>
            </Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-steam-dark">
                <Gamepad2 className="h-4 w-4" />
                Mano veiklos
              </Button>
            </Link>
            <Link href="/library" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-steam-dark">
                <BookOpen className="h-4 w-4" />
                Biblioteka
              </Button>
            </Link>
            {canViewAdminDashboard(role) && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-steam-dark">
                  <Shield className="h-4 w-4" />
                  Administravimas
                  <PendingBadge count={pendingRequests} />
                </Button>
              </Link>
            )}

            <div className="pt-3 mt-3 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full justify-start gap-3 h-11 text-accent-ink hover:text-accent-ink"
              >
                <LogOut className="h-4 w-4" />
                Atsijungti
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  )
}

/** "LIVE" only while a game runs; a paused game says so and does not pulse. */
function liveLabel(game: { title: string; paused?: boolean }) {
  return `${game.paused ? "Pristabdyta" : "LIVE"}: ${game.title}`
}

function LiveDot({ paused }: { paused?: boolean }) {
  if (paused) {
    return <span aria-hidden="true" className="inline-flex h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
  }
  return (
    <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
    </span>
  )
}
