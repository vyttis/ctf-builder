"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  AlertTriangle,
  Rocket,
  Wrench,
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
  // Duplicated/cloned tasks that still need a confirmed answer — blocks start
  tasksNeedingAnswer?: { id: string; title: string }[]
}

export function GameStatusActions({
  gameId,
  status,
  challengeCount,
  tasksNeedingAnswer = [],
}: GameStatusActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const hasPendingAnswers = tasksNeedingAnswer.length > 0

  async function updateStatus(newStatus: GameStatus) {
    setLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        // Another device already changed the status: show the current one.
        if (res.status === 409) router.refresh()
        throw new Error(err.error || "Nepavyko atnaujinti būsenos")
      }

      toast({
        title:
          newStatus === "active"
            ? "Veikla pradėta!"
            : newStatus === "finished"
            ? "Veikla baigta"
            : "Veikla pristabdyta",
        description:
          newStatus === "active"
            ? "Dalyviai gali prisijungti nuskaitę QR kodą."
            : newStatus === "finished"
            ? "Rezultatai ir analitika paruošti peržiūrai."
            : "Dalyviai matys pauzės pranešimą.",
      })

      setShowActivateDialog(false)
      setShowFinishDialog(false)
      router.refresh()
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description: error instanceof Error ? error.message : "Nepavyko atnaujinti būsenos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const finishDialog = (
    <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={loading}
          className="gap-2 border-accent/30 text-accent hover:bg-accent/5"
        >
          <Square className="h-4 w-4" />
          {status === "paused" ? "Baigti" : "Baigti veiklą"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baigti veiklą?</DialogTitle>
          <DialogDescription>
            Dalyviai nebegalės pateikti atsakymų, o jūs matysite rezultatų
            suvestinę. Šio veiksmo negalima atšaukti.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowFinishDialog(false)}>
            Atšaukti
          </Button>
          <Button
            onClick={() => updateStatus("finished")}
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-white gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Baigti veiklą
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (status === "draft") {
    return (
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogTrigger asChild>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 gap-2"
            disabled={challengeCount === 0}
          >
            <Rocket className="h-4 w-4" />
            Pradėti veiklą
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pradėti veiklą?</DialogTitle>
            <DialogDescription>
              Dalyviai galės prisijungti nuskaitę QR kodą arba įvedę veiklos
              kodą. Galėsite bet kada pristabdyti ar baigti veiklą.
            </DialogDescription>
          </DialogHeader>
          {challengeCount === 0 && (
            <div className="flex items-center gap-2 text-accent text-sm">
              <AlertCircle className="h-4 w-4" />
              Pridėkite bent 1 užduotį prieš pradėdami
            </div>
          )}
          {hasPendingAnswers && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-accent text-sm font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Šios užduotys neturi nustatyto atsakymo:
              </div>
              <ul className="text-sm text-steam-dark list-disc pl-6 space-y-0.5">
                {tasksNeedingAnswer.map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
              </ul>
              <Link href={`/games/${gameId}/builder`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 mt-1 border-accent/30 text-accent hover:bg-accent/5"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  Taisyti užduotis
                </Button>
              </Link>
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
              disabled={loading || challengeCount === 0 || hasPendingAnswers}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Pradėti
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
        {finishDialog}
      </div>
    )
  }

  if (status === "paused") {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => updateStatus("active")}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Tęsti
        </Button>
        {finishDialog}
      </div>
    )
  }

  // finished
  return (
    <Badge variant="secondary" className="text-sm gap-1 py-1.5 px-3">
      <Square className="h-3 w-3" />
      Veikla baigta
    </Badge>
  )
}
