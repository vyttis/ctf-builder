"use client"

import { Crown, Zap, Brain, Trophy, Flame, type LucideIcon } from "lucide-react"
import { ACHIEVEMENT_CONFIG, type AchievementType } from "@/lib/game/achievements"

const ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  Zap,
  Brain,
  Trophy,
  Flame,
}

interface AchievementBadgeProps {
  type: AchievementType
  size?: "sm" | "md"
}

export function AchievementBadge({ type, size = "md" }: AchievementBadgeProps) {
  const config = ACHIEVEMENT_CONFIG[type]
  const Icon = ICON_MAP[config.icon]

  const iconSize = size === "sm" ? 16 : 20
  const circleSize = size === "sm" ? 24 : 32

  return (
    <div
      title={config.name}
      role="img"
      aria-label={config.name}
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: circleSize,
        height: circleSize,
        backgroundColor: `${config.color}1A`, // 10% opacity
      }}
    >
      <Icon
        size={iconSize}
        style={{ color: config.color }}
        strokeWidth={2.5}
      />
    </div>
  )
}
