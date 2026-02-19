"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Loader2, Sparkles, ArrowRight, GamepadIcon } from "lucide-react"

const gameFormSchema = z.object({
  title: z.string().min(3, "Pavadinimas turi būti bent 3 simbolių"),
  description: z.string().optional(),
  max_teams: z.number().min(2).max(100),
  time_limit_minutes: z.number().nullable(),
  show_leaderboard: z.boolean(),
  shuffle_challenges: z.boolean(),
})

type GameFormData = z.infer<typeof gameFormSchema>

export function GameForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GameFormData>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      title: "",
      description: "",
      max_teams: 50,
      time_limit_minutes: null,
      show_leaderboard: true,
      shuffle_challenges: false,
    },
  })

  const showLeaderboard = watch("show_leaderboard")
  const shuffleChallenges = watch("shuffle_challenges")

  async function onSubmit(data: GameFormData) {
    setLoading(true)

    try {
      const res = await fetch("/api/games", {
        method: "POST",
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
        throw new Error(err.error || "Nepavyko sukurti žaidimo")
      }

      const game = await res.json()

      toast({
        title: "Žaidimas sukurtas!",
        description: `Kodas: ${game.game_code}`,
      })

      router.push(`/games/${game.id}`)
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main info */}
        <Card className="border-border/50 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <GamepadIcon className="h-5 w-5 text-primary" />
              Pagrindinė informacija
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Žaidimo pavadinimas *</Label>
              <Input
                id="title"
                placeholder="pvz., Vilniaus detektyvai"
                className="h-11 bg-white"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-accent">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Aprašymas</Label>
              <Textarea
                id="description"
                placeholder="Trumpas žaidimo aprašymas mokiniams..."
                className="resize-none bg-white"
                rows={3}
                {...register("description")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-border/50 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-highlight" />
              Nustatymai
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_teams">Maks. komandų</Label>
                <Input
                  id="max_teams"
                  type="number"
                  min={2}
                  max={100}
                  className="bg-white"
                  {...register("max_teams", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_limit">
                  Laiko limitas (min.)
                </Label>
                <Input
                  id="time_limit"
                  type="number"
                  min={10}
                  max={300}
                  placeholder="Be limito"
                  className="bg-white"
                  onChange={(e) => {
                    const val = e.target.value
                    setValue(
                      "time_limit_minutes",
                      val ? parseInt(val) : null
                    )
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Rodyti rezultatų lentelę
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Žaidėjai matys kitų komandų rezultatus
                  </p>
                </div>
                <Switch
                  checked={showLeaderboard}
                  onCheckedChange={(val) =>
                    setValue("show_leaderboard", val)
                  }
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
                  onCheckedChange={(val) =>
                    setValue("shuffle_challenges", val)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-lg shadow-primary/25"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Sukurti žaidimą
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </motion.div>
  )
}
