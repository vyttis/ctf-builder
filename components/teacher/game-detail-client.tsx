"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Challenge, GameStatus, GameSettings } from "@/types/game"
import { AiAssistantPanel } from "./ai-assistant-panel"
import { GameEditDialog } from "./game-edit-dialog"
import { GameDeleteDialog } from "./game-delete-dialog"
import { GameDuplicateDialog } from "./game-duplicate-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import {
  MoreHorizontal,
  Sparkles,
  Edit3,
  Trash2,
  Copy,
  BookOpen,
} from "lucide-react"

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
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)

  function handleSuggestionsAdded() {
    setAiSheetOpen(false)
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border/50"
          >
            <MoreHorizontal className="h-4 w-4" />
            Daugiau
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setAiSheetOpen(true)}>
            <Sparkles className="h-4 w-4 text-highlight" />
            DI Padėjėjas
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/games/${game.id}/lesson`}>
              <BookOpen className="h-4 w-4 text-secondary" />
              Sukurti pamoką
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDuplicateDialogOpen(true)}>
            <Copy className="h-4 w-4 text-primary" />
            Dubliuoti
          </DropdownMenuItem>
          {game.status === "draft" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit3 className="h-4 w-4 text-secondary" />
                Redaguoti
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-accent focus:text-accent"
              >
                <Trash2 className="h-4 w-4" />
                Ištrinti
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
      {/* Duplicate Dialog */}
      <GameDuplicateDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        gameId={game.id}
        gameTitle={game.title}
      />
    </>
  )
}
