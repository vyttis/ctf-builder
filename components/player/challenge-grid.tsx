"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Lock, Unlock, CheckCircle2, FileText, Hash, List } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ChallengeGridProps {
  challenges: Array<{
    id: string
    title: string
    description: string | null
    type: string
    points: number
    hints: string[]
    options: string[] | null
    order_index: number
    image_url: string | null
    maps_url: string | null
    hint_penalty: number
    prerequisites: string[]
  }>
  solvedIds: Set<string>
  onSelectChallenge: (index: number) => void
}

type ChallengeStatus = "locked" | "unlocked" | "solved"

const typeLabels: Record<string, string> = {
  text: "Tekstas",
  number: "Skaičius",
  multiple_choice: "Pasirinkimas",
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  multiple_choice: <List className="h-3.5 w-3.5" />,
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
}

export function ChallengeGrid({
  challenges,
  solvedIds,
  onSelectChallenge,
}: ChallengeGridProps) {
  const statusMap = useMemo(() => {
    const map = new Map<string, ChallengeStatus>()
    for (const challenge of challenges) {
      if (solvedIds.has(challenge.id)) {
        map.set(challenge.id, "solved")
      } else if (
        challenge.prerequisites.length === 0 ||
        challenge.prerequisites.every((preId) => solvedIds.has(preId))
      ) {
        map.set(challenge.id, "unlocked")
      } else {
        map.set(challenge.id, "locked")
      }
    }
    return map
  }, [challenges, solvedIds])

  const solvedCount = solvedIds.size
  const totalCount = challenges.length

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#00323C]">
          Išspręsta {solvedCount} iš {totalCount} užduočių
        </p>
        <div className="h-2 flex-1 max-w-[160px] ml-3 rounded-full bg-[#F8FAFB] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#00D296]"
            initial={{ width: 0 }}
            animate={{
              width: totalCount > 0 ? `${(solvedCount / totalCount) * 100}%` : "0%",
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {challenges.map((challenge) => {
          const status = statusMap.get(challenge.id) ?? "locked"
          const index = challenges.findIndex((c) => c.id === challenge.id)

          return (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              status={status}
              onSelect={() => onSelectChallenge(index)}
            />
          )
        })}
      </motion.div>
    </div>
  )
}

function ChallengeCard({
  challenge,
  status,
  onSelect,
}: {
  challenge: ChallengeGridProps["challenges"][number]
  status: ChallengeStatus
  onSelect: () => void
}) {
  const isLocked = status === "locked"
  const isSolved = status === "solved"
  const isUnlocked = status === "unlocked"

  return (
    <motion.div variants={cardVariants}>
      <Card
        className={`relative overflow-hidden transition-all duration-200 ${
          isLocked
            ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
            : isSolved
            ? "bg-[#00D296]/5 border-[#00D296]/30 cursor-default"
            : "bg-white border-l-4 border-l-[#00D296] border-t border-r border-b border-gray-200 cursor-pointer hover:shadow-md hover:border-l-[#00D296] hover:-translate-y-0.5"
        }`}
        onClick={isUnlocked ? onSelect : undefined}
        role={isUnlocked ? "button" : undefined}
        tabIndex={isUnlocked ? 0 : undefined}
        onKeyDown={
          isUnlocked
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelect()
                }
              }
            : undefined
        }
        aria-label={
          isLocked
            ? `${challenge.title} — pirmiausia išspręskite reikalingas užduotis`
            : isSolved
            ? `${challenge.title} — išspręsta`
            : challenge.title
        }
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
              {challenge.title}
            </CardTitle>
            <StatusIcon status={status} />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[10px] font-bold tabular-nums ${
                isSolved
                  ? "bg-[#00D296]/10 text-[#00D296] border-[#00D296]/20"
                  : isLocked
                  ? "bg-gray-100 text-gray-400 border-gray-200"
                  : "bg-[#FAC846]/10 text-[#00323C] border-[#FAC846]/30"
              }`}
            >
              {challenge.points} tšk.
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] gap-1 ${
                isLocked
                  ? "text-gray-400 border-gray-200"
                  : "text-[#008CB4] border-[#008CB4]/20"
              }`}
            >
              {typeIcons[challenge.type]}
              {typeLabels[challenge.type] ?? challenge.type}
            </Badge>
          </div>

          {/* Locked tooltip */}
          {isLocked && (
            <p className="mt-2 text-[10px] text-gray-400 leading-tight">
              Pirmiausia išspręskite reikalingas užduotis
            </p>
          )}
        </CardContent>

        {/* Solved overlay */}
        {isSolved && (
          <div className="absolute inset-0 bg-[#00D296]/[0.03] pointer-events-none" />
        )}
      </Card>
    </motion.div>
  )
}

function StatusIcon({ status }: { status: ChallengeStatus }) {
  switch (status) {
    case "locked":
      return (
        <div className="shrink-0 rounded-full bg-gray-100 p-1.5">
          <Lock className="h-3.5 w-3.5 text-gray-400" />
        </div>
      )
    case "solved":
      return (
        <div className="shrink-0 rounded-full bg-[#00D296]/10 p-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#00D296]" />
        </div>
      )
    case "unlocked":
      return (
        <div className="shrink-0 rounded-full bg-[#00D296]/10 p-1.5">
          <Unlock className="h-3.5 w-3.5 text-[#00D296]" />
        </div>
      )
  }
}
