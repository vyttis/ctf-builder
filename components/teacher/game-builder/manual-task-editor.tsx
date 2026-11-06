"use client"

import { useState, useEffect, useId } from "react"
import { Challenge, ChallengeType } from "@/types/game"
import { AiSuggestion } from "@/lib/ai/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Plus,
  Trash2,
  Lightbulb,
  Save,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
} from "lucide-react"
import { ImageUpload } from "../image-upload"
import { MapsEmbed } from "@/components/shared/maps-embed"
import { ChallengePrerequisites } from "../challenge-prerequisites"

interface ManualTaskEditorProps {
  gameId: string
  challenge?: Challenge | null
  prefillData?: AiSuggestion | null
  onSuccess: () => void
  onCancel: () => void
  // Free-mode prerequisites: which challenges must be solved first. Only shown
  // in free path mode when editing a saved challenge (needs a real id + the
  // full challenge list to build/validate the dependency graph).
  pathMode?: "linear" | "free"
  allChallenges?: Array<{
    id: string
    title: string
    order_index: number
    prerequisites?: string[]
  }>
}

export function ManualTaskEditor({
  gameId,
  challenge,
  prefillData,
  onSuccess,
  onCancel,
  pathMode = "linear",
  allChallenges = [],
}: ManualTaskEditorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showExtras, setShowExtras] = useState(false)
  // Unique per editor instance: the workspace is mounted twice (desktop panel
  // + mobile sheet), and a shared radio `name` would merge both mounts into
  // one DOM radio group. Also used to pair labels with inputs (a11y).
  const fieldId = useId()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<ChallengeType>("text")
  const [points, setPoints] = useState(100)
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [hints, setHints] = useState<string[]>([])
  const [options, setOptions] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [mapsUrl, setMapsUrl] = useState("")
  const [explanation, setExplanation] = useState("")
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | null
  >(null)
  const [hintPenalty, setHintPenalty] = useState(20)
  const [prerequisites, setPrerequisites] = useState<string[]>([])
  // Options as loaded from the server — used to detect edits that invalidate
  // the stored answer hash (we can never recover the original answer, only
  // its hash, so changed options force the teacher to re-mark the answer).
  const [initialOptions, setInitialOptions] = useState<string[] | null>(null)

  const showPrerequisites = pathMode === "free" && !!challenge

  // Initialize from challenge or prefill
  useEffect(() => {
    if (challenge) {
      setTitle(challenge.title)
      setDescription(challenge.description || "")
      setType(challenge.type)
      setPoints(challenge.points)
      setCorrectAnswer("")
      setHints(challenge.hints || [])
      setOptions(challenge.options || [])
      setInitialOptions(challenge.options || [])
      setImageUrl(challenge.image_url)
      setMapsUrl(challenge.maps_url || "")
      setExplanation(challenge.explanation || "")
      setDifficulty(challenge.difficulty)
      setHintPenalty(challenge.hint_penalty)
      setPrerequisites(challenge.prerequisites || [])
      if (
        challenge.explanation ||
        challenge.difficulty ||
        challenge.image_url ||
        challenge.maps_url ||
        (challenge.prerequisites && challenge.prerequisites.length > 0)
      ) {
        setShowExtras(true)
      }
    } else if (prefillData) {
      setTitle(prefillData.title)
      setDescription(prefillData.description)
      setType(prefillData.type)
      setPoints(prefillData.points)
      setCorrectAnswer(prefillData.correct_answer)
      setHints(prefillData.hints || [])
      setOptions(
        prefillData.type === "multiple_choice" && prefillData.options
          ? prefillData.options
          : []
      )
      setExplanation(prefillData.explanation || "")
      setDifficulty(prefillData.difficulty || null)
      if (prefillData.explanation || prefillData.difficulty) {
        setShowExtras(true)
      }
    }
  }, [challenge, prefillData])

  async function handleSave() {
    if (!title.trim()) {
      toast({
        title: "Pavadinimas privalomas",
        variant: "destructive",
      })
      return
    }
    // New tasks and duplicated/cloned tasks without a confirmed answer
    // (needs_answer) must get one; ordinary edits may leave it blank to keep
    // the existing answer.
    if ((!challenge || challenge.needs_answer) && !correctAnswer.trim()) {
      toast({
        title: "Atsakymas privalomas",
        variant: "destructive",
      })
      return
    }

    if (type === "multiple_choice") {
      const cleanOptions = options.map((o) => o.trim()).filter(Boolean)
      if (cleanOptions.length < 2) {
        toast({
          title: "Reikia bent dviejų atsakymo variantų",
          variant: "destructive",
        })
        return
      }
      // A marked answer must still exist among the options (it may have been
      // deleted or renamed after being marked).
      if (correctAnswer.trim() && !cleanOptions.includes(correctAnswer.trim())) {
        toast({
          title: "Pažymėkite teisingą atsakymą",
          description: "Pažymėtas atsakymas nebesutampa su nė vienu variantu.",
          variant: "destructive",
        })
        return
      }
      // Editing options without re-marking the answer would leave the stored
      // hash pointing at an option string that no longer exists — the task
      // would become unsolvable for students.
      const optionsChanged =
        challenge &&
        initialOptions !== null &&
        JSON.stringify(cleanOptions) !==
          JSON.stringify(initialOptions.map((o) => o.trim()).filter(Boolean))
      if (optionsChanged && !correctAnswer.trim()) {
        toast({
          title: "Pažymėkite teisingą atsakymą",
          description:
            "Pakeitus atsakymų variantus būtina iš naujo pažymėti teisingą.",
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)
    try {
      const isEditing = !!challenge
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        type,
        points,
        hints: hints.filter((h) => h.trim()),
        options:
          type === "multiple_choice"
            ? options.map((o) => o.trim()).filter(Boolean)
            : null,
        image_url: imageUrl || null,
        maps_url: mapsUrl.trim() || null,
        explanation: explanation.trim() || null,
        difficulty,
        hint_penalty: hintPenalty,
      }

      if (!isEditing) {
        payload.game_id = gameId
        payload.correct_answer = correctAnswer.trim()
        if (prefillData) {
          payload.generated_by_di = true
          payload.verification_verdict =
            prefillData.verification?.verdict ?? null
          payload.verification_issues =
            prefillData.verification?.issues ?? []
          payload.verification_confidence =
            prefillData.verification?.confidence ?? null
        }
      } else {
        if (correctAnswer.trim()) {
          payload.correct_answer = correctAnswer.trim()
        }
        // Prerequisites are only editable in free mode on a saved challenge.
        if (showPrerequisites) {
          payload.prerequisites = prerequisites
        }
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
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Nepavyko išsaugoti užduoties"
        )
      }

      toast({
        title: isEditing ? "Užduotis atnaujinta" : "Užduotis sukurta!",
      })
      onSuccess()
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description:
          error instanceof Error
            ? error.message
            : "Nepavyko išsaugoti užduoties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* AI prefill badge */}
      {prefillData && !challenge && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-highlight/10 border border-highlight/20 text-sm text-steam-dark">
          <Sparkles className="h-4 w-4 text-highlight shrink-0" />
          <span>Užpildyta pagal DI pasiūlymą. Peržiūrėkite ir patvirtinkite.</span>
        </div>
      )}

      {/* Needs-answer notice for duplicated/cloned tasks */}
      {challenge?.needs_answer && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-steam-dark">
          <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
          <span>
            Ši užduotis dar neturi teisingo atsakymo — įveskite jį žemiau, kad
            galėtumėte pradėti žaidimą.
          </span>
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor={`${fieldId}-title`} className="text-xs font-medium">
          Pavadinimas *
        </Label>
        <Input
          id={`${fieldId}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="pvz., Demografinis detektyvas"
          className="bg-white"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor={`${fieldId}-description`} className="text-xs font-medium">
          Aprašymas / klausimas
        </Label>
        <Textarea
          id={`${fieldId}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalus užduoties aprašymas dalyviams..."
          className="bg-white resize-none"
          rows={3}
        />
      </div>

      {/* Type + Points */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Tipas</Label>
          <Select value={type} onValueChange={(v) => setType(v as ChallengeType)}>
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
        <div className="space-y-1.5">
          <Label htmlFor={`${fieldId}-points`} className="text-xs font-medium">
            Taškai
          </Label>
          <Input
            id={`${fieldId}-points`}
            type="number"
            min={1}
            max={1000}
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 100)}
            className="bg-white"
          />
        </div>
      </div>

      {/* Multiple choice options */}
      {type === "multiple_choice" && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            Atsakymų variantai (pažymėkite teisingą)
          </Label>
          {options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`${fieldId}-correct-option`}
                aria-label={`Teisingas atsakymas: variantas ${i + 1}`}
                checked={correctAnswer === option && option.trim() !== ""}
                onChange={() => setCorrectAnswer(option)}
                disabled={!option.trim()}
                className="h-4 w-4 accent-primary shrink-0"
              />
              <Input
                value={option}
                onChange={(e) => {
                  const old = option
                  const newOpts = [...options]
                  newOpts[i] = e.target.value
                  setOptions(newOpts)
                  if (correctAnswer === old) {
                    setCorrectAnswer(e.target.value)
                  }
                }}
                placeholder={`Variantas ${i + 1}`}
                className="bg-white flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-accent"
                onClick={() => setOptions(options.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOptions([...options, ""])}
            className="gap-1 text-xs"
          >
            <Plus className="h-3 w-3" />
            Pridėti variantą
          </Button>
        </div>
      )}

      {/* Correct answer (non-multiple-choice or editing) */}
      {type !== "multiple_choice" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${fieldId}-answer`} className="text-xs font-medium">
            Teisingas atsakymas{" "}
            {challenge && !challenge.needs_answer
              ? "(palikite tuščią, jei nekeičiate)"
              : "*"}
          </Label>
          <Input
            id={`${fieldId}-answer`}
            type={type === "number" ? "number" : "text"}
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="Tikslus teisingas atsakymas"
            autoFocus={challenge?.needs_answer === true}
            className={`bg-white ${
              challenge?.needs_answer
                ? "border-accent/50 focus:border-accent"
                : "border-primary/30 focus:border-primary"
            }`}
          />
          <p className="text-[10px] text-muted-foreground">
            Tikrinant nesvarbu didžiosios raidės, lietuviškos raidės (š = s) ir tarpai pradžioje ar pabaigoje. Žodžio forma turi sutapti.
          </p>
        </div>
      )}

      {/* Hints */}
      <div className="space-y-2">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-highlight" />
          Užuominos
        </Label>
        {hints.map((hint, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={hint}
              onChange={(e) => {
                const newH = [...hints]
                newH[i] = e.target.value
                setHints(newH)
              }}
              placeholder={`Užuomina ${i + 1}`}
              className="bg-white flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-accent"
              onClick={() => setHints(hints.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setHints([...hints, ""])}
          className="gap-1 text-xs"
        >
          <Plus className="h-3 w-3" />
          Pridėti užuominą
        </Button>
      </div>

      {/* Free-mode prerequisites (only for saved challenges) */}
      {showPrerequisites && challenge && (
        <ChallengePrerequisites
          challengeId={challenge.id}
          gameId={gameId}
          allChallenges={allChallenges}
          currentPrerequisites={prerequisites}
          onChange={setPrerequisites}
        />
      )}

      {/* Collapsible extras */}
      <button
        type="button"
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-steam-dark transition-colors w-full py-2"
        onClick={() => setShowExtras(!showExtras)}
      >
        {showExtras ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        Papildomi laukai (paaiškinimas, sunkumas, nuotrauka, žemėlapis)
      </button>

      {showExtras && (
        <div className="space-y-4 pl-2 border-l-2 border-border/30">
          {/* Explanation */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-secondary" />
              Paaiškinimas (rodomas po teisingo atsakymo)
            </Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Trumpas edukacinis paaiškinimas dalyviams..."
              className="bg-white resize-none"
              rows={2}
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Sunkumas</Label>
            <div className="flex gap-2">
              {(
                [
                  { value: "easy", label: "Lengva", color: "text-primary-ink border-primary/30 hover:bg-primary/5" },
                  { value: "medium", label: "Vidutinė", color: "text-highlight border-highlight/30 hover:bg-highlight/5" },
                  { value: "hard", label: "Sunki", color: "text-accent border-accent/30 hover:bg-accent/5" },
                ] as const
              ).map((d) => (
                <Badge
                  key={d.value}
                  variant="outline"
                  className={`cursor-pointer text-xs px-3 py-1 ${d.color} ${
                    difficulty === d.value
                      ? "ring-2 ring-offset-1 ring-current"
                      : ""
                  }`}
                  onClick={() =>
                    setDifficulty(difficulty === d.value ? null : d.value)
                  }
                >
                  {d.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Hint penalty */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Užuominos kaina (taškų)
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={hintPenalty}
              onChange={(e) => setHintPenalty(parseInt(e.target.value) || 0)}
              className="bg-white w-32"
            />
          </div>

          {/* Image */}
          <ImageUpload value={imageUrl} onChange={setImageUrl} />

          {/* Maps */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-primary" />
              Google Maps nuoroda
            </Label>
            <Input
              placeholder="https://maps.google.com/..."
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              className="bg-white"
            />
            {mapsUrl.trim() && (
              <MapsEmbed
                url={mapsUrl.trim()}
                className="rounded-lg overflow-hidden mt-2"
              />
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={loading || !title.trim()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {challenge ? "Atnaujinti" : "Pridėti užduotį"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Atšaukti
        </Button>
      </div>
    </div>
  )
}
