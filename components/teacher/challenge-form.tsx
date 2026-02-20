"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Challenge } from "@/types/game"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Loader2, Plus, Trash2, Lightbulb, Save, MapPin } from "lucide-react"
import { ImageUpload } from "./image-upload"
import { MapsEmbed } from "@/components/shared/maps-embed"

const challengeFormSchema = z.object({
  title: z.string().min(1, "Pavadinimas privalomas"),
  description: z.string(),
  type: z.enum(["text", "number", "multiple_choice"]),
  points: z.number().min(1).max(1000),
  correct_answer: z.string().min(1, "Atsakymas privalomas"),
  hints: z.array(z.string()),
  options: z.array(z.string()).nullable(),
  image_url: z.string().url().nullable().optional(),
  maps_url: z.string().url().nullable().optional(),
})

type ChallengeFormData = z.infer<typeof challengeFormSchema>

interface ChallengeFormProps {
  gameId: string
  challenge?: Challenge
  onSuccess: () => void
  onCancel?: () => void
}

export function ChallengeForm({
  gameId,
  challenge,
  onSuccess,
  onCancel,
}: ChallengeFormProps) {
  const [loading, setLoading] = useState(false)
  const [hints, setHints] = useState<string[]>(challenge?.hints ?? [])
  const [options, setOptions] = useState<string[]>(challenge?.options ?? [])
  const [imageUrl, setImageUrl] = useState<string | null>(challenge?.image_url ?? null)
  const [mapsUrl, setMapsUrl] = useState(challenge?.maps_url ?? "")
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: {
      title: challenge?.title || "",
      description: challenge?.description || "",
      type: challenge?.type || "text",
      points: challenge?.points || 100,
      correct_answer: "",
      hints: challenge?.hints || [],
      options: challenge?.options || null,
      image_url: challenge?.image_url || null,
      maps_url: challenge?.maps_url || null,
    },
  })

  const challengeType = watch("type")

  async function onSubmit(data: ChallengeFormData) {
    setLoading(true)
    try {
      const isEditing = !!challenge

      const payload = {
        ...data,
        hints,
        options: data.type === "multiple_choice" ? options : null,
        image_url: imageUrl || null,
        maps_url: mapsUrl.trim() || null,
        ...(isEditing ? {} : { game_id: gameId }),
      }

      const res = await fetch(
        isEditing ? `/api/challenges/${challenge.id}` : "/api/challenges",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Nepavyko išsaugoti užduoties")
      }

      toast({
        title: isEditing ? "Užduotis atnaujinta" : "Užduotis sukurta!",
      })

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

  function addHint() {
    setHints([...hints, ""])
  }

  function removeHint(index: number) {
    setHints(hints.filter((_, i) => i !== index))
  }

  function updateHint(index: number, value: string) {
    const newHints = [...hints]
    newHints[index] = value
    setHints(newHints)
  }

  function addOption() {
    setOptions([...options, ""])
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index))
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Užduoties pavadinimas *</Label>
            <Input
              placeholder="pvz., Demografinis detektyvas"
              className="bg-white"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-accent">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Aprašymas / klausimas</Label>
            <Textarea
              placeholder="Detalus užduoties aprašymas mokiniams..."
              className="bg-white resize-none"
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Paveiksliukas */}
          <div className="sm:col-span-2">
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* Google Maps */}
          <div className="sm:col-span-2 space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Google Maps nuoroda (neprivaloma)
            </Label>
            <Input
              placeholder="https://maps.google.com/..."
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              className="bg-white"
            />
            {mapsUrl.trim() && (
              <div className="mt-2">
                <MapsEmbed url={mapsUrl.trim()} className="rounded-xl overflow-hidden" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipas</Label>
            <Select
              defaultValue={challengeType}
              onValueChange={(val) =>
                setValue("type", val as "text" | "number" | "multiple_choice")
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Tekstas</SelectItem>
                <SelectItem value="number">Skaičius</SelectItem>
                <SelectItem value="multiple_choice">Pasirinkimas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Taškai</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              className="bg-white"
              {...register("points", { valueAsNumber: true })}
            />
          </div>

          {/* Multiple choice options */}
          {challengeType === "multiple_choice" && (
            <div className="sm:col-span-2 space-y-2">
              <Label>Atsakymų variantai</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Variantas ${index + 1}`}
                      className="bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-accent shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Pridėti variantą
                </Button>
              </div>
            </div>
          )}

          <div className="sm:col-span-2 space-y-2">
            <Label>Teisingas atsakymas *</Label>
            <Input
              type={challengeType === "number" ? "number" : "text"}
              placeholder="Tikslus teisingas atsakymas"
              className="bg-white border-primary/30 focus:border-primary"
              {...register("correct_answer")}
            />
            {errors.correct_answer && (
              <p className="text-xs text-accent">
                {errors.correct_answer.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Atsakymas bus automatiškai normalizuotas (be didžiųjų raidžių, be tarpų)
            </p>
          </div>

          {/* Hints */}
          <div className="sm:col-span-2 space-y-2">
            <Label className="flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5 text-highlight" />
              Užuominos (neprivaloma)
            </Label>
            <div className="space-y-2">
              {hints.map((hint, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={hint}
                    onChange={(e) => updateHint(index, e.target.value)}
                    placeholder={`Užuomina ${index + 1}`}
                    className="bg-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHint(index)}
                    className="text-accent shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHint}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Pridėti užuominą
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
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
            {challenge ? "Atnaujinti" : "Pridėti užduotį"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Atšaukti
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  )
}
