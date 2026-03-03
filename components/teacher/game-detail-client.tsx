"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Challenge, GameStatus, GameSettings } from "@/types/game"
import { AiAssistantPanel } from "./ai-assistant-panel"
import { GameEditDialog } from "./game-edit-dialog"
import { GameDeleteDialog } from "./game-delete-dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Edit3, Trash2 } from "lucide-react"

interface GameDetailClientProps {
  game: {
    id: string
    title: string
    description: string | null
    status: GameStatus
    settings: GameSettings
    game_code: string
  }
  challenges: Challenge[]
}

export function GameDetailClient({ game, challenges }: GameDetailClientProps) {
  const router = useRouter()
  const [aiSheetOpen, setAiSheetOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  function handleSuggestionsAdded() {
    setAiSheetOpen(false)
    router.refresh()
  }

  return (
    <>
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setAiSheetOpen(true)}
          variant="outline"
          size="sm"
          className="gap-2 border-highlight/30 text-highlight hover:bg-highlight/5"
        >
          <Sparkles className="h-4 w-4" />
          DI Padėjėjas
        </Button>
        {game.status === "draft" && (
          <>
            <Button
              onClick={() => setEditDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 border-secondary/30 text-secondary hover:bg-secondary/5"
            >
              <Edit3 className="h-4 w-4" />
              Redaguoti
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 border-accent/30 text-accent hover:bg-accent/5"
            >
              <Trash2 className="h-4 w-4" />
              Ištrinti
            </Button>
          </>
        )}
      </div>

      {/* DI Assistant Panel */}
      <AiAssistantPanel
        open={aiSheetOpen}
        onOpenChange={setAiSheetOpen}
        gameId={game.id}
        gameTitle={game.title}
        gameDescription={game.description}
        existingChallenges={challenges}
        onSuggestionsAdded={handleSuggestionsAdded}
      />

      {/* Edit Dialog */}
      {game.status === "draft" && (
        <GameEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          game={game}
          onSuccess={() => {
            setEditDialogOpen(false)
            router.refresh()
          }}
        />
      )}

      {/* Delete Dialog */}
      {game.status === "draft" && (
        <GameDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          gameId={game.id}
          gameTitle={game.title}
        />
      )}
    </>
  )
}
