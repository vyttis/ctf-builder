"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Challenge } from "@/types/game"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GripVertical, Edit3, Trash2 } from "lucide-react"

interface SortableChallengeCardProps {
  challenge: Challenge
  index: number
  onEdit: (challenge: Challenge) => void
  onDelete: (challenge: Challenge) => void
}

export function SortableChallengeCard({
  challenge,
  index,
  onEdit,
  onDelete,
}: SortableChallengeCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-40 z-50" : ""}
    >
      <Card className="border-border/50 bg-white hover:border-border transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <button
              type="button"
              className="flex flex-col items-center gap-0.5 pt-1 cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-primary w-6 text-center">
                {index + 1}
              </span>
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-steam-dark truncate">
                  {challenge.title}
                </h3>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {challenge.points} tšk.
                </Badge>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {challenge.type === "text"
                    ? "Tekstas"
                    : challenge.type === "number"
                    ? "Skaičius"
                    : "Pasirinkimas"}
                </Badge>
              </div>
              {challenge.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {challenge.description}
                </p>
              )}
              {challenge.hints &&
                (challenge.hints as string[]).length > 0 && (
                  <p className="text-xs text-highlight mt-1">
                    💡 {(challenge.hints as string[]).length}{" "}
                    {(challenge.hints as string[]).length === 1
                      ? "užuomina"
                      : "užuominos"}
                  </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-secondary"
                onClick={() => onEdit(challenge)}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-accent"
                onClick={() => onDelete(challenge)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Lightweight overlay version shown during drag
export function ChallengeCardOverlay({ challenge, index }: { challenge: Challenge; index: number }) {
  return (
    <Card className="border-primary/30 bg-white shadow-lg shadow-primary/10 w-full max-w-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">{index + 1}</span>
          <h3 className="font-medium text-steam-dark truncate flex-1">
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
