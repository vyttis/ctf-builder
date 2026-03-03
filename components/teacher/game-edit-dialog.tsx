"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { GameSettings } from "@/types/game"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"

const editGameSchema = z.object({
  title: z.string().min(3, "Pavadinimas turi būti bent 3 simbolių"),
  description: z.string().optional(),
  max_teams: z.number().min(2).max(100),
  time_limit_minutes: z.number().nullable(),
  show_leaderboard: z.boolean(),
  shuffle_challenges: z.boolean(),
})

type EditGameData = z.infer<typeof editGameSchema>

interface GameEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: {
    id: string
    title: string
    description: string | null
    settings: GameSettings
  }
  onSuccess: () => void
}

export function GameEditDialog({
  open,
  onOpenChange,
  game,
  onSuccess,
}: GameEditDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditGameData>({
    resolver: zodResolver(editGameSchema),
    defaultValues: {
      title: game.title,
      description: game.description || "",
      max_teams: game.settings.max_teams,
      time_limit_minutes: game.settings.time_limit_minutes,
      show_leaderboard: game.settings.show_leaderboard,
      shuffle_challenges: game.settings.shuffle_challenges,
    },
  })

  const showLeaderboard = watch("show_leaderboard")
  const shuffleChallenges = watch("shuffle_challenges")

  async function onSubmit(data: EditGameData) {
    setLoading(true)
    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          settings: {
            max_teams: data.max_teams,
            time_limit_minutes: data.time_limit_minutes,
            show_leaderboard: data.show_leaderboard,
            shuffle_challenges: data.shuffle_challenges,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(typeof err.error === "string" ? err.error : "Nepavyko atnaujinti žaidimo")
      }

      toast({ title: "Žaidimas atnaujintas!" })
      onSuccess()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Redaguoti žaidimą</DialogTitle>
          <DialogDescription>
            Pakeiskite žaidimo pavadinimą, aprašymą ar nustatymus
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Pavadinimas *</Label>
            <Input
              id="edit-title"
              className="bg-white"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-accent">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Aprašymas</Label>
            <Textarea
              id="edit-description"
              className="resize-none bg-white"
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-max-teams">Maks. komandų</Label>
              <Input
                id="edit-max-teams"
                type="number"
                min={2}
                max={100}
                className="bg-white"
                {...register("max_teams", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time-limit">Laiko limitas (min.)</Label>
              <Input
                id="edit-time-limit"
                type="number"
                min={10}
                max={300}
                placeholder="Be limito"
                className="bg-white"
                defaultValue={game.settings.time_limit_minutes ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setValue("time_limit_minutes", val ? parseInt(val) : null)
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Rodyti rezultatų lentelę</Label>
                <p className="text-xs text-muted-foreground">
                  Žaidėjai matys kitų komandų rezultatus
                </p>
              </div>
              <Switch
                checked={showLeaderboard}
                onCheckedChange={(val) => setValue("show_leaderboard", val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Maišyti užduočių tvarką</Label>
                <p className="text-xs text-muted-foreground">
                  Kiekviena komanda gaus kitokią tvarką
                </p>
              </div>
              <Switch
                checked={shuffleChallenges}
                onCheckedChange={(val) => setValue("shuffle_challenges", val)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Atšaukti
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Išsaugoti
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
