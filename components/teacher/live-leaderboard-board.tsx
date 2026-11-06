"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { LiveTeam } from "@/hooks/use-live-game"
import { Crown, Medal, Users } from "lucide-react"
import { pluralizeLt } from "@/lib/utils"

interface LiveLeaderboardBoardProps {
  teams: LiveTeam[]
  solvedCounts: Map<string, number>
  totalChallenges: number
  /**
   * false when the activity's leaderboard is off: the class screen then
   * lists the teams that joined, by name, without places, points or progress.
   */
  ranked?: boolean
}

const podiumStyles = [
  "border-highlight/60 bg-highlight/10",
  "border-white/30 bg-white/10",
  "border-accent/50 bg-accent/10",
]

const podiumIcons = [
  <Crown key="1" className="h-7 w-7 text-highlight" />,
  <Medal key="2" className="h-7 w-7 text-white/70" />,
  <Medal key="3" className="h-7 w-7 text-accent" />,
]

// Large ranked leaderboard for the projector class screen (dark background).
export function LiveLeaderboardBoard({
  teams,
  solvedCounts,
  totalChallenges,
  ranked = true,
}: LiveLeaderboardBoardProps) {
  const prefersReduced = useReducedMotion()

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/50">
        <Users className="h-16 w-16 mb-4 opacity-40" />
        <p className="text-2xl font-medium">Laukiama komandų...</p>
        <p className="text-base mt-2 text-white/40">
          Nuskaitykite QR kodą ir prisijunkite
        </p>
      </div>
    )
  }

  if (!ranked) {
    const byName = [...teams].sort((a, b) => a.name.localeCompare(b.name, "lt"))
    return (
      <div>
        <p className="mb-4 text-base text-white/60">
          Prisijungė {teams.length} {pluralizeLt(teams.length, "komanda", "komandos", "komandų")}. Rezultatų lentelė
          šioje veikloje nerodoma.
        </p>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {byName.map((team) => (
            <li
              key={team.id}
              className="truncate rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-2xl font-bold text-white"
            >
              {team.name}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {teams.map((team, index) => {
          const isTop3 = index < 3
          const solved = solvedCounts.get(team.id) ?? 0

          return (
            <motion.div
              key={team.id}
              layout={!prefersReduced}
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`flex items-center gap-5 rounded-2xl border px-6 py-4 ${
                isTop3
                  ? podiumStyles[index]
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${
                  isTop3 ? "bg-white/15" : "bg-white/10 text-white/60"
                }`}
              >
                {isTop3 ? podiumIcons[index] : index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-bold text-white ${
                    isTop3 ? "text-3xl" : "text-2xl"
                  }`}
                >
                  {team.name}
                </p>
                <p className="text-sm text-white/50 mt-0.5">
                  {solved} / {totalChallenges} užd. išspręsta
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={`font-bold tabular-nums text-white ${
                    isTop3 ? "text-4xl" : "text-3xl"
                  }`}
                >
                  {team.total_points}
                </p>
                <p className="text-xs text-white/50">taškų</p>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
