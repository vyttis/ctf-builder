"use client"

import { AiSuggestion } from "@/lib/ai/types"
import { Challenge } from "@/types/game"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AnimatePresence } from "framer-motion"
import { DraggableSuggestionCard } from "./draggable-suggestion-card"
import {
  Sparkles,
  Loader2,
  Wand2,
  AlertCircle,
  Puzzle,
  Plus,
  RefreshCw,
} from "lucide-react"

const quickActions = [
  { label: "3 klausimus", prompt: "Sugeneruok 3 įvairius klausimus" },
  {
    label: "Sunkesnių",
    prompt: "Sugeneruok sunkesnių užduočių, vertų daugiau taškų",
  },
  {
    label: "Pasirinkimo",
    prompt: "Sugeneruok tik multiple_choice tipo užduotis",
  },
]

interface SuggestionsPanelProps {
  gameTitle: string
  gameDescription: string | null
  existingChallenges: Challenge[]
  suggestions: AiSuggestion[]
  selectedIds: Set<number>
  addedIds: Set<number>
  adding: boolean
  loading: boolean
  error: string | null
  teacherPrompt: string
  onTeacherPromptChange: (value: string) => void
  onGenerate: (promptOverride?: string, append?: boolean) => void
  onToggleSelect: (index: number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onAdd: (index: number) => void
  onBulkAdd: () => void
  onReject: (index: number) => void
}

export function SuggestionsPanel({
  gameTitle,
  gameDescription,
  existingChallenges,
  suggestions,
  selectedIds,
  addedIds,
  adding,
  loading,
  error,
  teacherPrompt,
  onTeacherPromptChange,
  onGenerate,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onAdd,
  onBulkAdd,
  onReject,
}: SuggestionsPanelProps) {
  const selectableCount = suggestions.filter(
    (s, i) => s.verification?.verdict !== "fail" && !addedIds.has(i)
  ).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-highlight" />
        <h2 className="font-semibold text-steam-dark">DI Padėjėjas</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Sugeneruokite užduočių pasiūlymus ir vilkite juos į kairę pusę
      </p>

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
              onClick={() => onGenerate(action.prompt)}
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
          onChange={(e) => onTeacherPromptChange(e.target.value)}
          className="resize-none bg-white text-sm"
          rows={3}
          disabled={loading}
        />
        <Button
          onClick={() => onGenerate()}
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
              onClick={() => onGenerate()}
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

      {/* Selection toolbar */}
      {!loading && suggestions.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={onSelectAll}
              disabled={selectableCount === 0}
            >
              Pasirinkti visas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={onDeselectAll}
              disabled={selectedIds.size === 0}
            >
              Atžymėti
            </Button>
          </div>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white text-xs h-7 gap-1"
            disabled={selectedIds.size === 0 || adding}
            onClick={onBulkAdd}
          >
            {adding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Pridėti ({selectedIds.size})
          </Button>
        </div>
      )}

      {/* Suggestions list */}
      {!loading && suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">
            Pasiūlymai ({suggestions.length}) — vilkite į kairę arba spauskite „Pridėti"
          </p>
          <AnimatePresence>
            {suggestions.map((suggestion, index) => (
              <DraggableSuggestionCard
                key={`${suggestion.title}-${index}`}
                suggestion={suggestion}
                index={index}
                selected={selectedIds.has(index)}
                added={addedIds.has(index)}
                adding={adding}
                onToggleSelect={onToggleSelect}
                onAdd={onAdd}
                onReject={onReject}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Generate more / Regenerate buttons */}
      {!loading && suggestions.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1 flex-1"
            onClick={() => onGenerate(undefined, true)}
          >
            <Sparkles className="h-3 w-3" />
            Generuoti dar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1 flex-1 text-accent border-accent/30 hover:bg-accent/5"
            onClick={() => {
              if (
                window.confirm(
                  "Ar tikrai norite pergeneruoti? Dabartiniai pasiūlymai bus pakeisti."
                )
              ) {
                onGenerate()
              }
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Regeneruoti
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && suggestions.length === 0 && !error && (
        <div className="text-center py-6">
          <Sparkles className="h-8 w-8 text-highlight/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Paspauskite mygtuką arba pasirinkite greitą veiksmą, kad DI
            sugeneruotų užduočių pasiūlymus pagal jūsų žaidimo temą.
          </p>
        </div>
      )}
    </div>
  )
}
