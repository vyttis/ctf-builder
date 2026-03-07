"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { Challenge } from "@/types/game"
import { AiSuggestion, DiGenerateResponse } from "@/lib/ai/types"
import { ChallengeListPanel } from "./challenge-list-panel"
import { SuggestionsPanel } from "./suggestions-panel"
import { ChallengeCardOverlay } from "./sortable-challenge-card"
import { AiSuggestionCard } from "../ai-suggestion-card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChallengeBuilderProps {
  gameId: string
  gameTitle: string
  gameDescription: string | null
  challenges: Challenge[]
  onChallengesChange: (challenges: Challenge[]) => void
  onRefreshChallenges: () => void
  onEditChallenge: (challenge: Challenge) => void
  onDeleteChallenge: (challenge: Challenge) => void
  onAddNew: () => void
}

export function ChallengeBuilder({
  gameId,
  gameTitle,
  gameDescription,
  challenges,
  onChallengesChange,
  onRefreshChallenges,
  onEditChallenge,
  onDeleteChallenge,
  onAddNew,
}: ChallengeBuilderProps) {
  const { toast } = useToast()

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isOverChallengeList, setIsOverChallengeList] = useState(false)

  // AI suggestions state (lifted up from AiAssistantPanel)
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teacherPrompt, setTeacherPrompt] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)

  // Mobile sheet
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  // ============= AI Generation =============

  const handleGenerate = useCallback(
    async (promptOverride?: string, append = false) => {
      setLoading(true)
      setError(null)

      if (!append) {
        setSelectedIds(new Set())
        setAddedIds(new Set())
      }

      try {
        const res = await fetch("/api/di/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: gameId,
            game_title: gameTitle,
            game_description: gameDescription,
            existing_challenges: challenges.map((c) => ({
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

        const data: DiGenerateResponse = await res.json()
        if (append) {
          setSuggestions((prev) => [...prev, ...data.suggestions])
        } else {
          setSuggestions(data.suggestions)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nežinoma klaida")
      } finally {
        setLoading(false)
      }
    },
    [gameId, gameTitle, gameDescription, challenges, teacherPrompt]
  )

  function handleReject(index: number) {
    setSuggestions((prev) => prev.filter((_, i) => i !== index))
    setSelectedIds((prev) => {
      const next = new Set<number>()
      prev.forEach((id) => {
        if (id < index) next.add(id)
        else if (id > index) next.add(id - 1)
      })
      return next
    })
    setAddedIds((prev) => {
      const next = new Set<number>()
      prev.forEach((id) => {
        if (id < index) next.add(id)
        else if (id > index) next.add(id - 1)
      })
      return next
    })
  }

  function handleToggleSelect(index: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function handleSelectAll() {
    const passableIds = new Set<number>()
    suggestions.forEach((s, i) => {
      if (s.verification?.verdict !== "fail" && !addedIds.has(i)) {
        passableIds.add(i)
      }
    })
    setSelectedIds(passableIds)
  }

  function handleDeselectAll() {
    setSelectedIds(new Set())
  }

  async function addSuggestion(index: number): Promise<boolean> {
    const suggestion = suggestions[index]
    if (!suggestion || addedIds.has(index)) return false

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          title: suggestion.title,
          description: suggestion.description || "",
          type: suggestion.type,
          points: Number(suggestion.points) || 100,
          correct_answer: String(suggestion.correct_answer),
          hints: (suggestion.hints || []).slice(0, 10),
          options:
            suggestion.type === "multiple_choice" ? suggestion.options : null,
          generated_by_di: true,
          verification_verdict: suggestion.verification?.verdict ?? null,
          verification_issues: suggestion.verification?.issues ?? [],
          verification_confidence: suggestion.verification?.confidence ?? null,
        }),
      })

      if (res.ok) {
        setAddedIds((prev) => new Set(prev).add(index))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(index)
          return next
        })
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async function handleAddSingle(index: number) {
    setAdding(true)
    const ok = await addSuggestion(index)
    if (ok) {
      toast({ title: "Užduotis pridėta" })
      onRefreshChallenges()
    } else {
      toast({
        title: "Nepavyko pridėti",
        variant: "destructive",
      })
    }
    setAdding(false)
  }

  async function handleBulkAdd() {
    const toAdd = Array.from(selectedIds)
      .filter((i) => !addedIds.has(i))
      .filter((i) => suggestions[i]?.verification?.verdict !== "fail")

    if (toAdd.length === 0) return

    setAdding(true)
    let successCount = 0

    for (const i of toAdd) {
      const ok = await addSuggestion(i)
      if (ok) successCount++
    }

    setSelectedIds(new Set())

    if (successCount > 0) {
      toast({
        title: `Pridėta užduočių: ${successCount}`,
      })
      onRefreshChallenges()
    } else {
      toast({
        title: "Nepavyko pridėti užduočių",
        variant: "destructive",
      })
    }
    setAdding(false)
  }

  // ============= DnD Handlers =============

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event
    if (!over) {
      setIsOverChallengeList(false)
      return
    }

    const overId = String(over.id)
    // If dragging over the challenge list drop zone or any challenge card
    setIsOverChallengeList(
      overId === "challenge-list-drop" || overId.startsWith("challenge-")
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setIsOverChallengeList(false)

    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    // Case 1: Reorder within challenge list
    if (
      activeIdStr.startsWith("challenge-") &&
      (overIdStr.startsWith("challenge-") || overIdStr === "challenge-list-drop")
    ) {
      if (overIdStr === "challenge-list-drop" || activeIdStr === overIdStr) return

      const oldIndex = challenges.findIndex(
        (c) => `challenge-${c.id}` === activeIdStr
      )
      const newIndex = challenges.findIndex(
        (c) => `challenge-${c.id}` === overIdStr
      )

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(challenges, oldIndex, newIndex)
      onChallengesChange(reordered)

      // Persist
      await fetch("/api/challenges/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          order: reordered.map((c, i) => ({ id: c.id, order_index: i })),
        }),
      })
    }

    // Case 2: Drop suggestion into challenge list
    if (
      activeIdStr.startsWith("suggestion-") &&
      (overIdStr.startsWith("challenge-") || overIdStr === "challenge-list-drop")
    ) {
      const suggestionIndex = parseInt(
        activeIdStr.replace("suggestion-", ""),
        10
      )
      if (isNaN(suggestionIndex)) return

      setAdding(true)
      const ok = await addSuggestion(suggestionIndex)
      if (ok) {
        toast({ title: "Užduotis pridėta" })
        onRefreshChallenges()
      } else {
        toast({
          title: "Nepavyko pridėti",
          variant: "destructive",
        })
      }
      setAdding(false)
    }
  }

  // Get active item data for drag overlay
  const activeSuggestionIndex = activeId?.startsWith("suggestion-")
    ? parseInt(activeId.replace("suggestion-", ""), 10)
    : null
  const activeChallengeId = activeId?.startsWith("challenge-")
    ? activeId.replace("challenge-", "")
    : null

  const activeSuggestion =
    activeSuggestionIndex !== null ? suggestions[activeSuggestionIndex] : null
  const activeChallengeIndex = activeChallengeId
    ? challenges.findIndex((c) => c.id === activeChallengeId)
    : -1
  const activeChallenge =
    activeChallengeIndex >= 0 ? challenges[activeChallengeIndex] : null

  // Shared panel props
  const panelProps = {
    gameTitle,
    gameDescription,
    existingChallenges: challenges,
    suggestions,
    selectedIds,
    addedIds,
    adding,
    loading,
    error,
    teacherPrompt,
    onTeacherPromptChange: setTeacherPrompt,
    onGenerate: handleGenerate,
    onToggleSelect: handleToggleSelect,
    onSelectAll: handleSelectAll,
    onDeselectAll: handleDeselectAll,
    onAdd: handleAddSingle,
    onBulkAdd: handleBulkAdd,
    onReject: handleReject,
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Left panel: Challenge list */}
        <div className="min-w-0">
          <ChallengeListPanel
            challenges={challenges}
            onEdit={onEditChallenge}
            onDelete={onDeleteChallenge}
            onAddNew={onAddNew}
            onOpenAiMobile={() => setMobileSheetOpen(true)}
            isOverPanel={
              isOverChallengeList &&
              activeId?.startsWith("suggestion-") === true
            }
          />
        </div>

        {/* Right panel: Suggestions (desktop only) */}
        <div className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto rounded-lg border border-border/50 bg-white p-4">
            <SuggestionsPanel {...panelProps} />
          </div>
        </div>
      </div>

      {/* Mobile: Suggestions as Sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[440px] sm:max-w-[440px] flex flex-col overflow-hidden p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
            <SheetTitle className="flex items-center gap-2 text-steam-dark">
              <Sparkles className="h-5 w-5 text-highlight" />
              DI Padėjėjas
            </SheetTitle>
            <SheetDescription>
              DI sugeneruos užduočių pasiūlymus pagal jūsų žaidimo temą
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <SuggestionsPanel {...panelProps} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeChallenge && (
          <ChallengeCardOverlay
            challenge={activeChallenge}
            index={activeChallengeIndex}
          />
        )}
        {activeSuggestion && activeSuggestionIndex !== null && (
          <div className="w-[360px] opacity-90 shadow-lg rounded-lg">
            <AiSuggestionCard
              suggestion={activeSuggestion}
              index={activeSuggestionIndex}
              selected={false}
              added={false}
              adding={false}
              onToggleSelect={() => {}}
              onAdd={() => {}}
              onReject={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
