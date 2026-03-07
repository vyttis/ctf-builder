"use client"

import { useState } from "react"
import { GameSettings } from "@/types/game"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"

interface BuilderSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: string
  title: string
  description: string | null
  settings: GameSettings
  onSaved: () => void
}

export function BuilderSettings({
  open,
  onOpenChange,
  gameId,
  title,
  description,
  settings,
  onSaved,
}: BuilderSettingsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formTitle, setFormTitle] = useState(title)
  const [formDescription, setFormDescription] = useState(description || "")
  const [maxTeams, setMaxTeams] = useState(settings.max_teams)
  const [timeLimit, setTimeLimit] = useState<number | null>(
    settings.time_limit_minutes
  )
  const [showLeaderboard, setShowLeaderboard] = useState(
    settings.show_leaderboard
  )
  const [shuffleChallenges, setShuffleChallenges] = useState(
    settings.shuffle_challenges
  )

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription || null,
          settings: {
            max_teams: maxTeams,
            time_limit_minutes: timeLimit,
            show_leaderboard: showLeaderboard,
            shuffle_challenges: shuffleChallenges,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Nepavyko atnaujinti"
        )
      }

      toast({ title: "Nustatymai išsaugoti!" })
      onSaved()
      onOpenChange(false)
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description:
          error instanceof Error ? error.message : "Nepavyko išsaugoti",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Žaidimo nustatymai</SheetTitle>
          <SheetDescription>
            Pakeiskite pavadinimą, aprašymą ar žaidimo nustatymus
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label>Pavadinimas *</Label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Aprašymas</Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="resize-none bg-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maks. komandų</Label>
              <Input
                type="number"
                min={2}
                max={100}
                value={maxTeams}
                onChange={(e) => setMaxTeams(parseInt(e.target.value) || 50)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Laiko limitas (min.)</Label>
              <Input
                type="number"
                min={5}
                max={300}
                placeholder="Be limito"
                value={timeLimit ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setTimeLimit(val ? parseInt(val) : null)
                }}
                className="bg-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Rezultatų lentelė
                </Label>
                <p className="text-xs text-muted-foreground">
                  Žaidėjai matys kitų komandų rezultatus
                </p>
              </div>
              <Switch
                checked={showLeaderboard}
                onCheckedChange={setShowLeaderboard}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Maišyti užduočių tvarką
                </Label>
                <p className="text-xs text-muted-foreground">
                  Kiekviena komanda gaus kitokią tvarką
                </p>
              </div>
              <Switch
                checked={shuffleChallenges}
                onCheckedChange={setShuffleChallenges}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading || !formTitle.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Išsaugoti
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
