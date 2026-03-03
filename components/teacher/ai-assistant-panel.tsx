"use client"

import { useState } from "react"
import { Challenge } from "@/types/game"
import { AiSuggestion, AiSuggestResponse } from "@/lib/ai/types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AiSuggestionCard } from "./ai-suggestion-card"
import { AnimatePresence } from "framer-motion"
import { Sparkles, Loader2, Wand2, AlertCircle, Puzzle } from "lucide-react"

interface AiAssistantPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: string
  gameTitle: string
  gameDescription: string | null
  existingChallenges: Challenge[]
  onAcceptSuggestion: (suggestion: AiSuggestion) => void
}

const quickActions = [
  { label: "3 klausimus", prompt: "Sugeneruok 3 įvairius klausimus" },
  { label: "Sunkesnių", prompt: "Sugeneruok sunkesnių užduočių, vertų daugiau taškų" },
  { label: "Pasirinkimo", prompt: "Sugeneruok tik multiple_choice tipo užduotis" },
]

export function AiAssistantPanel({
  open,
  onOpenChange,
  gameId,
  gameTitle,
  gameDescription,
  existingChallenges,
  onAcceptSuggestion,
}: AiAssistantPanelProps) {
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teacherPrompt, setTeacherPrompt] = useState("")

  async function handleGenerate(promptOverride?: string) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          game_title: gameTitle,
          game_description: gameDescription,
          existing_challenges: existingChallenges.map((c) => ({
            title: c.title,
            description: c.description,
            type: c.type,
            points: c.points,
          })),
          teacher_prompt: promptOverride || teacherPrompt.trim() || undefined,
          count: 3,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Nepavyko sugeneruoti pasiūlymų")
      }

      const data: AiSuggestResponse = await res.json()
      setSuggestions(data.suggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nežinoma klaida")
    } finally {
      setLoading(false)
    }
  }

  function handleReject(index: number) {
    setSuggestions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAccept(suggestion: AiSuggestion) {
    onAcceptSuggestion(suggestion)
    setSuggestions((prev) => prev.filter((s) => s !== suggestion))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] sm:max-w-[440px] flex flex-col overflow-hidden p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-steam-dark">
            <Sparkles className="h-5 w-5 text-highlight" />
            AI Padėjėjas
          </SheetTitle>
          <SheetDescription>
            AI sugeneruos užduočių pasiūlymus pagal jūsų žaidimo temą
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Game context */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <Puzzle className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-steam-dark">
                {gameTitle}
              </span>
            </div>
            {gameDescription && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {gameDescription}
              </p>
            )}
            <Badge variant="outline" className="text-xs mt-2">
              {existingChallenges.length} užduotys jau sukurta
            </Badge>
          </div>

          {/* Quick actions */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Greiti veiksmai
            </p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleGenerate(action.prompt)}
                  className="text-xs h-7 gap-1 border-highlight/30 text-highlight hover:bg-highlight/5"
                >
                  <Wand2 className="h-3 w-3" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          <div className="space-y-2">
            <Textarea
              placeholder="Aprašykite kokių užduočių norite... (neprivaloma)"
              value={teacherPrompt}
              onChange={(e) => setTeacherPrompt(e.target.value)}
              className="resize-none bg-white text-sm"
              rows={3}
              disabled={loading}
            />
            <Button
              onClick={() => handleGenerate()}
              disabled={loading}
              className="w-full bg-highlight hover:bg-highlight/90 text-steam-dark font-medium gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generuojama...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generuoti pasiūlymus
                </>
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-accent font-medium">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleGenerate()}
                  className="text-xs text-accent mt-1 h-6 px-0 hover:bg-transparent hover:text-accent/80"
                >
                  Bandyti dar kartą
                </Button>
              </div>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/30 p-4 space-y-2"
                >
                  <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-6 w-16 bg-muted/30 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-muted/30 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions list */}
          {!loading && suggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                Pasiūlymai ({suggestions.length})
              </p>
              <AnimatePresence>
                {suggestions.map((suggestion, index) => (
                  <AiSuggestionCard
                    key={`${suggestion.title}-${index}`}
                    suggestion={suggestion}
                    index={index}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty state */}
          {!loading && suggestions.length === 0 && !error && (
            <div className="text-center py-6">
              <Sparkles className="h-8 w-8 text-highlight/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Paspauskite mygtuką arba pasirinkite greitą veiksmą, kad AI
                sugeneruotų užduočių pasiūlymus pagal jūsų žaidimo temą.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
