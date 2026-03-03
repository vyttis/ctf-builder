"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Challenge } from "@/types/game"
import { AiSuggestion } from "@/lib/ai/types"
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
import { Loader2, Plus, Trash2, Lightbulb, Save, MapPin, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
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
  prefillData?: AiSuggestion
  onSuccess: () => void
  onCancel?: () => void
}

export function ChallengeForm({
  gameId,
  challenge,
  prefillData,
  onSuccess,
  onCancel,
}: ChallengeFormProps) {
  const [loading, setLoading] = useState(false)
  const [hints, setHints] = useState<string[]>(challenge?.hints ?? [])
  const [options, setOptions] = useState<string[]>(challenge?.options ?? [])
  const [imageUrl, setImageUrl] = useState<string | null>(challenge?.image_url ?? null)
  const [mapsUrl, setMapsUrl] = useState(challenge?.maps_url ?? "")
  const [showExplanation, setShowExplanation] = useState(false)
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

  // Apply AI suggestion prefill
  useEffect(() => {
    if (prefillData) {
      setValue("title", prefillData.title)
      setValue("description", prefillData.description)
      setValue("type", prefillData.type)
      setValue("points", prefillData.points)
      setValue("correct_answer", prefillData.correct_answer)
      setHints(prefillData.hints)
      if (prefillData.type === "multiple_choice" && prefillData.options) {
        setOptions(prefillData.options)
      } else {
        setOptions([])
      }
    }
  }, [prefillData, setValue])

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
        const errorMessage = typeof err.error === "string" ? err.error : "Nepavyko išsaugoti užduoties"
        throw new Error(errorMessage)
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
        {prefillData && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-highlight/10 border border-highlight/20 text-sm text-steam-dark">
            <Sparkles className="h-4 w-4 text-highlight shrink-0" />
            <span>Užpildyta pagal DI pasiūlymą. Peržiūrėkite ir patvirtinkite.</span>
          </div>
        )}
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

          {/* Multiple choice options with radio-button correct answer */}
          {challengeType === "multiple_choice" && (
            <div className="sm:col-span-2 space-y-2">
              <Label>Atsakymų variantai (pasirinkite teisingą)</Label>
              <div className="space-y-2">
                {options.map((option, index) => {
                  const correctAnswer = watch("correct_answer")
                  const isCorrect = option.trim() !== "" && option.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                        isCorrect
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/30"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (option.trim()) {
                            setValue("correct_answer", option.trim())
                          }
                        }}
                        className="shrink-0"
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </button>
                      <Input
                        value={option}
                        onChange={(e) => {
                          const oldVal = option.trim()
                          updateOption(index, e.target.value)
                          // If this was the correct answer, update it
                          if (oldVal && oldVal.toLowerCase() === correctAnswer.trim().toLowerCase()) {
                            setValue("correct_answer", e.target.value.trim())
                          }
                        }}
                        placeholder={`Variantas ${index + 1}`}
                        className="bg-white border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-accent shrink-0 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
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
              {errors.correct_answer && (
                <p className="text-xs text-accent">
                  Pasirinkite teisingą atsakymą paspaudę apskritimą
                </p>
              )}
              {/* Hidden input to track correct_answer */}
              <input type="hidden" {...register("correct_answer")} />
            </div>
          )}

          {/* Text/number correct answer input */}
          {challengeType !== "multiple_choice" && (
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
          )}

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

        {/* DI explanation (collapsible) */}
        {prefillData?.explanation && (
          <div className="border-t border-border/30 pt-3">
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 transition-colors"
            >
              {showExplanation ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              DI paaiškinimas
            </button>
            {showExplanation && (
              <p className="text-xs text-muted-foreground mt-1.5 pl-4 border-l-2 border-secondary/20">
                {prefillData.explanation}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {prefillData && (
            <Button
              type="submit"
              disabled={loading}
              className="bg-highlight hover:bg-highlight/90 text-steam-dark gap-2 font-medium"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Patvirtinti kaip yra
            </Button>
          )}
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
            {challenge ? "Atnaujinti" : prefillData ? "Pridėti su pakeitimais" : "Pridėti užduotį"}
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
