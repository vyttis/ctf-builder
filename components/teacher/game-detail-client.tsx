"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GameStatus, GameSettings } from "@/types/game"
import { GameEditDialog } from "./game-edit-dialog"
import { GameDeleteDialog } from "./game-delete-dialog"
import { GameDuplicateDialog } from "./game-duplicate-dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, Edit3, Trash2, Copy, BookOpen } from "lucide-react"

interface GameDetailClientProps {
  game: {
    id: string
    title: string
    description: string | null
    status: GameStatus
    settings: GameSettings
    game_code: string
  }
}

export function GameDetailClient({ game }: GameDetailClientProps) {
  const router = useRouter()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)

  return (
    <>
      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Single AI surface: the builder's DI tab (verified generation pipeline) */}
        <Link href={`/games/${game.id}/builder`}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-highlight/40 text-highlight-ink hover:bg-highlight/10"
          >
            <Sparkles className="h-4 w-4" />
            DI Padėjėjas
          </Button>
        </Link>
        <Link href={`/games/${game.id}/lesson`}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-secondary/30 text-secondary hover:bg-secondary/5"
          >
            <BookOpen className="h-4 w-4" />
            Sukurti pamoką
          </Button>
        </Link>
        <Button
          onClick={() => setDuplicateDialogOpen(true)}
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
        >
          <Copy className="h-4 w-4" />
          Dubliuoti
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
