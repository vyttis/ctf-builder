"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Medal,
  Crown,
  ArrowLeft,
  Users,
  Star,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import type { LeaderboardEntry, PlayerSession } from "@/types/game"

const podiumColors = [
  "from-yellow-400/20 to-yellow-500/5 border-yellow-400/30",
  "from-gray-300/20 to-gray-400/5 border-gray-300/30",
  "from-orange-400/20 to-orange-500/5 border-orange-400/30",
]

const podiumIcons = [
  <Crown key="1" className="h-5 w-5 text-yellow-500" />,
  <Medal key="2" className="h-5 w-5 text-gray-400" />,
  <Medal key="3" className="h-5 w-5 text-orange-500" />,
]

export default function LeaderboardPage() {
  const params = useParams()
  const gameCode = (params.gameCode as string).toUpperCase()

  const [teams, setTeams] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const stored = localStorage.getItem(`ctf_session_${gameCode}`)
    if (stored) {
      try {
        const session: PlayerSession = JSON.parse(stored)
        setMyTeamId(session.team_id)
      } catch {}
    }
    fetchLeaderboard()
  }, [gameCode])

  useEffect(() => {
    if (!gameId) return

    const channel = supabase
      .channel(`leaderboard_${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `game_id=eq.${gameId}` },
        () => fetchLeaderboard()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId])

  async function fetchLeaderboard() {
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("game_code", gameCode)
      .single()

    if (!game) { setLoading(false); return }
    setGameId(game.id)

    const { data } = await supabase
      .from("teams")
      .select("id, name, total_points, current_challenge_index, joined_at, updated_at")
      .eq("game_id", game.id)
      .order("total_points", { ascending: false })
      .order("updated_at", { ascending: true })

    if (data) setTeams(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/play/${gameCode}/play`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Žaidimas
            </Button>
          </Link>
          <Badge variant="outline" className="font-mono tracking-wider">{gameCode}</Badge>
        </div>

        <div className="text-center mb-8">
          <img src="/illustrations/trophy.svg" alt="" className="w-32 h-32 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-steam-dark">Rezultatų lentelė</h1>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{teams.length} {teams.length === 1 ? "komanda" : "komandos"}</span>
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Atnaujinama realiu laiku</span>
          </div>
        </div>

        {teams.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence>
              {teams.map((team, index) => {
                const isMe = team.id === myTeamId
                const isTop3 = index < 3

                return (
                  <motion.div
                    key={team.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`border transition-all ${
                      isMe
                        ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10"
                        : isTop3
                        ? `bg-gradient-to-r ${podiumColors[index]}`
                        : "border-border/50 bg-white"
                    }`}>
                      <CardContent className="p-3.5 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          isTop3 ? "bg-white shadow-sm" : "bg-muted/50 text-muted-foreground"
                        }`}>
                          {isTop3 ? podiumIcons[index] : index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold truncate ${isMe ? "text-primary" : "text-steam-dark"}`}>
                              {team.name}
                            </span>
                            {isMe && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                                Jūs
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {team.current_challenge_index} užd. išspręsta
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-highlight" />
                            <span className="font-bold text-lg text-steam-dark">{team.total_points}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">taškų</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Dar nėra prisijungusių komandų</p>
          </div>
        )}
      </div>
    </div>
  )
}
