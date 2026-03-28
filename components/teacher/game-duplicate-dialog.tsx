"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Copy, Loader2 } from "lucide-react"

interface GameDuplicateDialogProps {
  gameId: string
  gameTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GameDuplicateDialog({
  gameId,
  gameTitle,
  open,
  onOpenChange,
}: GameDuplicateDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState(`${gameTitle} (kopija)`)
  const [duplicating, setDuplicating] = useState(false)

  // Sync title when dialog opens with a different game
  useEffect(() => {
    if (open) {
      setTitle(`${gameTitle} (kopija)`)
    }
  }, [open, gameTitle])

  async function handleDuplicate() {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/games/${gameId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Nepavyko dubliuoti žaidimo"
        )
      }

      const data = await res.json()

      toast({ title: "Žaidimas sėkmingai dubliuotas" })

      onOpenChange(false)
      router.push(`/games/${data.game_id}`)
      router.refresh()
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description:
          error instanceof Error
            ? error.message
            : "Nepavyko dubliuoti žaidimo",
        variant: "destructive",
      })
    } finally {
      setDuplicating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Dubliuoti žaidimą
          </DialogTitle>
          <DialogDescription>
            Bus nukopijuoti visi nustatymai ir užduotys su atsakymais. Komandos
            ir rezultatai nebus kopijuojami.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="duplicate-title">Naujo žaidimo pavadinimas</Label>
          <Input
            id="duplicate-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Įveskite pavadinimą"
            disabled={duplicating}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={duplicating}
          >
            Atšaukti
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={duplicating || title.trim().length < 3}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            {duplicating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {duplicating ? "Dubliuojama..." : "Dubliuoti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
