"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Clock, Timer, Plus, Loader2 } from "lucide-react"

interface TimeControlsProps {
  gameId: string
  currentTimeLimit: number | null
}

export function TimeControls({ gameId, currentTimeLimit }: TimeControlsProps) {
  const [additionalMinutes, setAdditionalMinutes] = useState<string>("5")
  const [extending, setExtending] = useState(false)
  const [timeLimit, setTimeLimit] = useState<number | null>(currentTimeLimit)
  const { toast } = useToast()

  async function handleExtend() {
    const minutes = parseInt(additionalMinutes, 10)
    if (isNaN(minutes) || minutes < 1) return

    setExtending(true)
    try {
      const newLimit = (timeLimit || 0) + minutes

      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { time_limit_minutes: newLimit },
        }),
      })

      if (res.ok) {
        setTimeLimit(newLimit)
        toast({
          title: "Laikas pratęstas",
          description: `Laiko limitas dabar: ${newLimit} min.`,
        })
      } else {
        const data = await res.json()
        toast({
          title: "Klaida",
          description: data.error || "Nepavyko pratęsti laiko",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Klaida",
        description: "Nepavyko pratęsti laiko",
        variant: "destructive",
      })
    } finally {
      setExtending(false)
    }
  }

  return (
    <Card className="border-border/50 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-steam-green" />
          Laiko valdymas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current time limit display */}
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
          <Timer className="h-5 w-5 text-steam-dark/60" />
          <div>
            <p className="text-xs text-muted-foreground">Laiko limitas</p>
            <p className="font-semibold text-sm text-steam-dark">
              {timeLimit ? `${timeLimit} min.` : "Nėra"}
            </p>
          </div>
        </div>

        {/* Extend time */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Pratęsti laiką
          </p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                min={1}
                max={180}
                value={additionalMinutes}
                onChange={(e) => setAdditionalMinutes(e.target.value)}
                className="pr-12 text-sm"
                placeholder="5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                min.
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleExtend}
              disabled={
                extending ||
                !additionalMinutes ||
                parseInt(additionalMinutes, 10) < 1
              }
              className="bg-steam-green hover:bg-steam-green/90 shrink-0"
            >
              {extending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Pratęsti
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
