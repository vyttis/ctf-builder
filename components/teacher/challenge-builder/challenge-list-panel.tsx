"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Challenge } from "@/types/game"
import { SortableChallengeCard } from "./sortable-challenge-card"
import { Plus, Sparkles, Puzzle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChallengeListPanelProps {
  challenges: Challenge[]
  onEdit: (challenge: Challenge) => void
  onDelete: (challenge: Challenge) => void
  onAddNew: () => void
  onOpenAiMobile: () => void
  isOverPanel: boolean
}

export function ChallengeListPanel({
  challenges,
  onEdit,
  onDelete,
  onAddNew,
  onOpenAiMobile,
  isOverPanel,
}: ChallengeListPanelProps) {
  const { setNodeRef } = useDroppable({
    id: "challenge-list-drop",
  })

  const sortableIds = challenges.map((c) => `challenge-${c.id}`)

  return (
    <div className="space-y-3">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-steam-dark flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-primary" />
            Užduotys
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {challenges.length}{" "}
            {challenges.length === 1
              ? "užduotis"
              : challenges.length >= 10 && challenges.length <= 20
              ? "užduočių"
              : "užduotys"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onOpenAiMobile}
            variant="outline"
            size="sm"
            className="lg:hidden gap-1.5 border-highlight/30 text-highlight hover:bg-highlight/5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            DI
          </Button>
          <Button
            onClick={onAddNew}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nauja</span>
          </Button>
        </div>
      </div>

      {/* Sortable list */}
      <div
        ref={setNodeRef}
        className={`min-h-[200px] rounded-lg transition-colors ${
          isOverPanel
            ? "bg-primary/5 border-2 border-dashed border-primary/30"
            : ""
        }`}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          {challenges.length > 0 ? (
            <div className="space-y-2">
              {challenges.map((challenge, index) => (
                <SortableChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <img
                src="/illustrations/empty-state.svg"
                alt=""
                className="w-32 h-32 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-base font-semibold text-steam-dark mb-2">
                {isOverPanel
                  ? "Paleiskite užduotį čia"
                  : "Dar nėra užduočių"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isOverPanel
                  ? "Atleiskite pelę, kad pridėtumėte užduotį"
                  : "Pridėkite rankiniu būdu arba vilkite iš DI pasiūlymų"}
              </p>
              {!isOverPanel && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={onAddNew}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Pridėti užduotį
                  </Button>
                </div>
              )}
            </div>
          )}
        </SortableContext>

        {/* Drop indicator at bottom when list has items and something is being dragged over */}
        {isOverPanel && challenges.length > 0 && (
          <div className="mt-2 h-12 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center">
            <p className="text-xs text-primary font-medium">
              Paleiskite čia, kad pridėtumėte į galą
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
