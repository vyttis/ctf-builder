"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { GameStatus } from "@/types/game"
import {
  Play,
  Pause,
  Square,
  Loader2,
  AlertCircle,
  Rocket,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface GameStatusActionsProps {
  gameId: string
  status: GameStatus
  challengeCount: number
}

export function GameStatusActions({
  gameId,
  status,
  challengeCount,
}: GameStatusActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function updateStatus(newStatus: GameStatus) {
    setLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Nepavyko atnaujinti statuso")
      }

      toast({
        title: "Statusas atnaujintas",
        description:
          newStatus === "active"
            ? "Žaidimas aktyvuotas! Mokiniai gali prisijungti."
            : newStatus === "finished"
            ? "Žaidimas baigtas."
            : "Žaidimas pristabdytas.",
      })

      setShowActivateDialog(false)
      router.refresh()
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description: error instanceof Error ? error.message : "Klaida",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "draft") {
    return (
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogTrigger asChild>
          <Button
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 gap-2"
            disabled={challengeCount === 0}
          >
            <Rocket className="h-4 w-4" />
            Aktyvuoti žaidimą
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktyvuoti žaidimą?</DialogTitle>
            <DialogDescription>
              Mokiniai galės prisijungti nuskaitę QR kodą arba įvedę žaidimo
              kodą. Galėsite bet kada pristabdyti ar baigti žaidimą.
            </DialogDescription>
          </DialogHeader>
          {challengeCount === 0 && (
            <div className="flex items-center gap-2 text-accent text-sm">
              <AlertCircle className="h-4 w-4" />
              Pridėkite bent 1 užduotį prieš aktyvuodami
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActivateDialog(false)}
            >
              Atšaukti
            </Button>
            <Button
              onClick={() => updateStatus("active")}
              disabled={loading || challengeCount === 0}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Aktyvuoti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (status === "active") {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => updateStatus("paused")}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
          Pristabdyti
        </Button>
        <Button
          variant="outline"
          onClick={() => updateStatus("finished")}
          disabled={loading}
          className="gap-2 border-accent/30 text-accent hover:bg-accent/5"
        >
          <Square className="h-4 w-4" />
          Baigti žaidimą
        </Button>
      </div>
    )
  }

  if (status === "paused") {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => updateStatus("active")}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Tęsti
        </Button>
        <Button
          variant="outline"
          onClick={() => updateStatus("finished")}
          disabled={loading}
          className="gap-2 border-accent/30 text-accent hover:bg-accent/5"
        >
          <Square className="h-4 w-4" />
          Baigti
        </Button>
      </div>
    )
  }

  // finished
  return (
    <Badge variant="secondary" className="text-sm gap-1 py-1.5 px-3">
      <Square className="h-3 w-3" />
      Žaidimas baigtas
    </Badge>
  )
}
