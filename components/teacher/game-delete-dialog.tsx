"use client"

import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Loader2 } from "lucide-react"

interface GameDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: string
  gameTitle: string
  onSuccess?: () => void
}

export function GameDeleteDialog({
  open,
  onOpenChange,
  gameId,
  gameTitle,
  onSuccess,
}: GameDeleteDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(typeof err.error === "string" ? err.error : "Nepavyko ištrinti žaidimo")
      }

      toast({ title: "Žaidimas ištrintas" })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description: error instanceof Error ? error.message : "Klaida",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent" />
            Ištrinti žaidimą?
          </DialogTitle>
          <DialogDescription>
            Ar tikrai norite ištrinti žaidimą &ldquo;{gameTitle}&rdquo;?
            Bus ištrintos visos užduotys, komandos ir pateikimai.
            Šis veiksmas negrįžtamas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Atšaukti
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-accent hover:bg-accent/90 text-white gap-2"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {deleting ? "Trinama..." : "Ištrinti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
