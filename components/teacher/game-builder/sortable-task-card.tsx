"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Challenge } from "@/types/game"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GripVertical, Edit3, Trash2, Copy, Sparkles } from "lucide-react"

interface SortableTaskCardProps {
  challenge: Challenge
  index: number
  isSelected: boolean
  onSelect: (challenge: Challenge) => void
  onDelete: (challenge: Challenge) => void
  onDuplicate: (challenge: Challenge) => void
}

export function SortableTaskCard({
  challenge,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `challenge-${challenge.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const difficultyLabel =
    challenge.difficulty === "easy"
      ? "Lengva"
      : challenge.difficulty === "medium"
      ? "Vidutinė"
      : challenge.difficulty === "hard"
      ? "Sunki"
      : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-40 z-50" : ""}
    >
      <Card
        className={`border-border/50 bg-white hover:border-primary/30 transition-colors cursor-pointer ${
          isSelected ? "ring-2 ring-primary/40 border-primary/30" : ""
        }`}
        onClick={() => onSelect(challenge)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              type="button"
              className="flex flex-col items-center gap-0.5 pt-0.5 cursor-grab active:cursor-grabbing touch-none shrink-0"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-primary w-5 text-center">
                {index + 1}
              </span>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-medium text-sm text-steam-dark truncate">
                  {challenge.title}
                </h3>
                {challenge.generated_by_di && (
                  <Sparkles className="h-3 w-3 text-highlight shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {challenge.points} tšk.
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {challenge.type === "text"
                    ? "Tekstas"
                    : challenge.type === "number"
                    ? "Skaičius"
                    : "Pasirinkimas"}
                </Badge>
                {difficultyLabel && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      challenge.difficulty === "easy"
                        ? "text-primary border-primary/30"
                        : challenge.difficulty === "hard"
                        ? "text-accent border-accent/30"
                        : "text-highlight border-highlight/30"
                    }`}
                  >
                    {difficultyLabel}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(challenge)
                }}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(challenge)
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(challenge)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TaskCardOverlay({
  challenge,
  index,
}: {
  challenge: Challenge
  index: number
}) {
  return (
    <Card className="border-primary/30 bg-white shadow-lg shadow-primary/10 w-full max-w-md">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">{index + 1}</span>
          <h3 className="font-medium text-sm text-steam-dark truncate flex-1">
            {challenge.title}
          </h3>
          <Badge variant="outline" className="text-xs">
            {challenge.points} tšk.
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
