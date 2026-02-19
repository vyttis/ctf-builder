"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Users, ArrowRight, Loader2, Gamepad2 } from "lucide-react"
import type { PlayerSession } from "@/types/game"

export default function JoinGamePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gameCode = (params.gameCode as string).toUpperCase()

  const [teamName, setTeamName] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(`ctf_session_${gameCode}`)
    if (stored) {
      try {
        const session: PlayerSession = JSON.parse(stored)
        if (session.session_token) {
          router.replace(`/play/${gameCode}/play`)
          return
        }
      } catch {}
    }
    setChecking(false)
  }, [gameCode, router])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_code: gameCode,
          team_name: teamName.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Nepavyko prisijungti")
      }

      const data = await res.json()

      const session: PlayerSession = {
        team_id: data.team_id,
        session_token: data.session_token,
        game_code: gameCode,
        team_name: data.team_name,
      }
      localStorage.setItem(`ctf_session_${gameCode}`, JSON.stringify(session))

      router.push(`/play/${gameCode}/play`)
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description: error instanceof Error ? error.message : "Klaida",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="flex justify-center mb-6">
          <img
            src="/illustrations/adventure-start.svg"
            alt=""
            className="w-48 h-48"
          />
        </div>

        <Card className="border-0 shadow-2xl shadow-primary/10 bg-white/90 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <span className="font-mono text-sm font-bold text-primary tracking-widest">
                {gameCode}
              </span>
            </div>
            <CardTitle className="text-xl font-bold text-steam-dark">
              Prisijunk prie žaidimo!
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Komandos vardas"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="pl-10 h-12 text-base bg-white"
                    maxLength={30}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Sugalvokite kūrybingą komandos vardą
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !teamName.trim()}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Pradėti žaidimą
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          STEAM LT Klaipėda &middot; CTF Builder
        </p>
      </motion.div>
    </div>
  )
}
