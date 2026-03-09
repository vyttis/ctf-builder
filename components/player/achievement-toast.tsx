"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Crown, Zap, Brain, Trophy, Flame, X, type LucideIcon } from "lucide-react"
import { ACHIEVEMENT_CONFIG, type AchievementType } from "@/lib/game/achievements"

const ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  Zap,
  Brain,
  Trophy,
  Flame,
}

const ACHIEVEMENT_DESCRIPTIONS: Record<AchievementType, string> = {
  first_solver: "Išsprendėte užduotį pirmieji!",
  speed_demon: "Išsprendėte greičiau nei per minutę!",
  hint_free: "Išsprendėte be jokių užuominų!",
  perfect_game: "Visos užduotys be užuominų — tobula!",
  streak: "Teisingi atsakymai iš eilės!",
}

interface AchievementToastProps {
  achievement: {
    type: AchievementType
    metadata?: Record<string, unknown>
  }
  onDismiss: () => void
}

export function AchievementToast({
  achievement,
  onDismiss,
}: AchievementToastProps) {
  const config = ACHIEVEMENT_CONFIG[achievement.type]
  const Icon = ICON_MAP[config.icon]

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  let description = ACHIEVEMENT_DESCRIPTIONS[achievement.type]
  if (
    achievement.type === "streak" &&
    typeof achievement.metadata?.streak_count === "number"
  ) {
    description = `${achievement.metadata.streak_count} teisingi atsakymai iš eilės!`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed top-14 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
      >
        <div
          className="flex items-center gap-3 rounded-xl border border-steam-yellow/30 bg-gradient-to-r from-steam-yellow/15 to-steam-yellow/5 px-4 py-3 shadow-lg backdrop-blur-sm"
        >
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{
              width: 40,
              height: 40,
              backgroundColor: `${config.color}1A`,
            }}
          >
            <Icon size={22} style={{ color: config.color }} strokeWidth={2.5} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-steam-dark">
              🏆 {config.name}
            </p>
            <p className="text-xs text-steam-dark/70 leading-snug">
              {description}
            </p>
          </div>

          <button
            onClick={onDismiss}
            className="shrink-0 rounded-md p-1 text-steam-dark/40 transition-colors hover:bg-steam-dark/5 hover:text-steam-dark/70"
            aria-label="Uždaryti"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
