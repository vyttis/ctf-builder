"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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
import { Challenge, GameStatus, GameSettings } from "@/types/game"
import { AiSuggestion, DiGenerateResponse, ScenarioPreset } from "@/lib/ai/types"
import { BuilderHeader } from "./builder-header"
import { BuilderSettings } from "./builder-settings"
import { TaskListPanel } from "./task-list-panel"
import { TaskWorkspace } from "./task-workspace"
import { TaskCardOverlay } from "./sortable-task-card"
import { AiSuggestionCard } from "../ai-suggestion-card"
import { useToast } from "@/hooks/use-toast"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Sparkles } from "lucide-react"

interface GameBuilderProps {
  initialGame: {
    id: string
    title: string
    description: string | null
    status: GameStatus
    settings: GameSettings
    game_code: string
  }
  initialChallenges: Challenge[]
}

export function GameBuilder({ initialGame, initialChallenges }: GameBuilderProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Game state
  const [game] = useState(initialGame)
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges)
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null)

  // Editor state
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [prefillData, setPrefillData] = useState<AiSuggestion | null>(null)
  const [previewChallenge, setPreviewChallenge] = useState<Challenge | null>(null)

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Workspace tab
  const [activeTab, setActiveTab] = useState("di")

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isOverChallengeList, setIsOverChallengeList] = useState(false)

  // DI state
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([])
  const [diLoading, setDiLoading] = useState(false)
  const [diError, setDiError] = useState<string | null>(null)
  const [teacherPrompt, setTeacherPrompt] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<ScenarioPreset | null>(null)

  // Mobile sheet
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  // ========== Refresh challenges ==========
  const refreshChallenges = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges?game_id=${game.id}`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.challenges || [])
        const sorted = list.sort(
          (a: Challenge, b: Challenge) => a.order_index - b.order_index
        )
        setChallenges(sorted)
      }
    } catch {
      // silent
    }
  }, [game.id])

  // ========== DI Generation ==========
  const handleGenerate = useCallback(
    async (promptOverride?: string, append = false) => {
      setDiLoading(true)
      setDiError(null)
      if (!append) {
        setSelectedIds(new Set())
        setAddedIds(new Set())
      }
      try {
        const res = await fetch("/api/di/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: game.id,
            game_title: game.title,
            game_description: game.description,
            existing_challenges: challenges.map((c) => ({
              title: c.title,
              description: c.description,
              type: c.type,
              points: c.points,
            })),
            teacher_prompt: promptOverride || teacherPrompt.trim() || undefined,
            count: 3,
            scenario: selectedScenario || undefined,
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
        setDiError(err instanceof Error ? err.message : "Nežinoma klaida")
      } finally {
        setDiLoading(false)
      }
    },
    [game.id, game.title, game.description, challenges, teacherPrompt, selectedScenario]
  )

  // ========== Suggestion helpers ==========
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
    const ids = new Set<number>()
    suggestions.forEach((s, i) => {
      if (s.verification?.verdict !== "fail" && !addedIds.has(i)) ids.add(i)
    })
    setSelectedIds(ids)
  }

  function handleDeselectAll() {
    setSelectedIds(new Set())
  }

  async function addSuggestion(index: number): Promise<string | null> {
    const suggestion = suggestions[index]
    if (!suggestion || addedIds.has(index)) return "Pasiūlymas jau pridėtas"
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: game.id,
          title: suggestion.title,
          description: suggestion.description || "",
          type: suggestion.type,
          points: Number(suggestion.points) || 100,
          correct_answer: String(suggestion.correct_answer),
          hints: (suggestion.hints || []).slice(0, 10),
          options: suggestion.type === "multiple_choice" ? suggestion.options : null,
          explanation: suggestion.explanation || null,
          difficulty: suggestion.difficulty || null,
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
        return null
      }
      const errBody = await res.json().catch(() => null)
      const msg = errBody?.error || `HTTP ${res.status}`
      console.error("addSuggestion failed:", msg, { status: res.status, suggestion: suggestion.title })
      return msg
    } catch (err) {
      console.error("addSuggestion network error:", err)
      return "Tinklo klaida"
    }
  }

  async function handleAddSingle(index: number) {
    setAdding(true)
    const error = await addSuggestion(index)
    if (!error) {
      toast({ title: "Užduotis pridėta" })
      refreshChallenges()
    } else {
      toast({ title: "Nepavyko pridėti", description: error, variant: "destructive" })
    }
    setAdding(false)
  }

  async function handleBulkAdd() {
    const toAdd = Array.from(selectedIds)
      .filter((i) => !addedIds.has(i))
      .filter((i) => suggestions[i]?.verification?.verdict !== "fail")
    if (toAdd.length === 0) return

    setAdding(true)
    let count = 0
    let lastError: string | null = null
    for (const i of toAdd) {
      const error = await addSuggestion(i)
      if (!error) count++
      else lastError = error
    }
    setSelectedIds(new Set())
    if (count > 0) {
      toast({ title: `Pridėta užduočių: ${count}` })
      refreshChallenges()
    } else {
      toast({ title: "Nepavyko pridėti užduočių", description: lastError || undefined, variant: "destructive" })
    }
    setAdding(false)
  }

  // ========== Challenge actions ==========
  function handleSelectChallenge(challenge: Challenge) {
    setSelectedChallengeId(challenge.id)
    setEditingChallenge(challenge)
    setIsCreatingNew(false)
    setPrefillData(null)
    setPreviewChallenge(null)
    setActiveTab("manual")
  }

  function handleAddNew() {
    setEditingChallenge(null)
    setIsCreatingNew(true)
    setPrefillData(null)
    setPreviewChallenge(null)
    setSelectedChallengeId(null)
    setActiveTab("manual")
  }

  async function handleDeleteChallenge(challenge: Challenge) {
    if (!window.confirm(`Ar tikrai norite ištrinti "${challenge.title}"?`)) return
    try {
      const res = await fetch(`/api/challenges/${challenge.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({ title: "Užduotis ištrinta" })
        if (editingChallenge?.id === challenge.id) {
          setEditingChallenge(null)
          setIsCreatingNew(false)
        }
        refreshChallenges()
      }
    } catch {
      toast({ title: "Nepavyko ištrinti", variant: "destructive" })
    }
  }

  async function handleDuplicateChallenge(challenge: Challenge) {
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: game.id,
          title: `${challenge.title} (kopija)`,
          description: challenge.description || "",
          type: challenge.type,
          points: challenge.points,
          correct_answer: "placeholder",
          hints: challenge.hints || [],
          options: challenge.options,
          explanation: challenge.explanation,
          difficulty: challenge.difficulty,
          hint_penalty: challenge.hint_penalty,
        }),
      })
      if (res.ok) {
        toast({ title: "Užduotis nukopijuota" })
        refreshChallenges()
      }
    } catch {
      toast({ title: "Nepavyko kopijuoti", variant: "destructive" })
    }
  }

  function handleEditorSuccess() {
    setEditingChallenge(null)
    setIsCreatingNew(false)
    setPrefillData(null)
    refreshChallenges()
  }

  function handleEditorCancel() {
    setEditingChallenge(null)
    setIsCreatingNew(false)
    setPrefillData(null)
  }

  // ========== DnD handlers ==========
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
    setIsOverChallengeList(
      overId === "challenge-list-drop" || overId.startsWith("challenge-")
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setIsOverChallengeList(false)
    if (!over) return

    const activeStr = String(active.id)
    const overStr = String(over.id)

    // Reorder within challenge list
    if (
      activeStr.startsWith("challenge-") &&
      (overStr.startsWith("challenge-") || overStr === "challenge-list-drop")
    ) {
      if (overStr === "challenge-list-drop" || activeStr === overStr) return
      const oldIdx = challenges.findIndex((c) => `challenge-${c.id}` === activeStr)
      const newIdx = challenges.findIndex((c) => `challenge-${c.id}` === overStr)
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return

      const reordered = arrayMove(challenges, oldIdx, newIdx)
      setChallenges(reordered)

      await fetch("/api/challenges/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: game.id,
          order: reordered.map((c, i) => ({ id: c.id, order_index: i })),
        }),
      })
    }

    // Drop suggestion into challenge list
    if (
      activeStr.startsWith("suggestion-") &&
      (overStr.startsWith("challenge-") || overStr === "challenge-list-drop")
    ) {
      const idx = parseInt(activeStr.replace("suggestion-", ""), 10)
      if (isNaN(idx)) return
      setAdding(true)
      const error = await addSuggestion(idx)
      if (!error) {
        toast({ title: "Užduotis pridėta" })
        refreshChallenges()
      } else {
        toast({ title: "Nepavyko pridėti", description: error, variant: "destructive" })
      }
      setAdding(false)
    }
  }

  // DnD overlay data
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

  return (
    <div className="min-h-screen bg-muted/20">
      <BuilderHeader
        game={game}
        challengeCount={challenges.length}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenQr={() => {
          window.open(
            `/play/${game.game_code}`,
            "_blank"
          )
        }}
      />

      <BuilderSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        gameId={game.id}
        title={game.title}
        description={game.description}
        settings={game.settings}
        onSaved={() => {
          router.refresh()
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
            {/* Left panel: Task list */}
            <div className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto rounded-lg border border-border/50 bg-white p-4">
              <TaskListPanel
                challenges={challenges}
                selectedId={selectedChallengeId}
                onSelect={handleSelectChallenge}
                onDelete={handleDeleteChallenge}
                onDuplicate={handleDuplicateChallenge}
                onAddNew={handleAddNew}
                isOverPanel={
                  isOverChallengeList &&
                  activeId?.startsWith("suggestion-") === true
                }
              />
              {/* Mobile: open DI sheet */}
              <div className="lg:hidden mt-4">
                <button
                  type="button"
                  className="w-full p-3 rounded-lg border border-highlight/30 bg-highlight/5 text-sm font-medium text-highlight flex items-center justify-center gap-2"
                  onClick={() => setMobileSheetOpen(true)}
                >
                  <Sparkles className="h-4 w-4" />
                  DI Padėjėjas / Redagavimas
                </button>
              </div>
            </div>

            {/* Right panel: Workspace (desktop) */}
            <div className="hidden lg:block">
              <div className="rounded-lg border border-border/50 bg-white p-4">
                <TaskWorkspace
                  gameId={game.id}
                  gameTitle={game.title}
                  gameDescription={game.description}
                  challenges={challenges}
                  editingChallenge={editingChallenge}
                  prefillData={prefillData}
                  isCreatingNew={isCreatingNew}
                  onEditorSuccess={handleEditorSuccess}
                  onEditorCancel={handleEditorCancel}
                  previewChallenge={previewChallenge}
                  onClosePreview={() => setPreviewChallenge(null)}
                  suggestions={suggestions}
                  selectedIds={selectedIds}
                  addedIds={addedIds}
                  adding={adding}
                  diLoading={diLoading}
                  diError={diError}
                  teacherPrompt={teacherPrompt}
                  onTeacherPromptChange={setTeacherPrompt}
                  onGenerate={handleGenerate}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onAddSuggestion={handleAddSingle}
                  onBulkAdd={handleBulkAdd}
                  onReject={handleReject}
                  selectedScenario={selectedScenario}
                  onScenarioChange={setSelectedScenario}
                  onTaskAdded={refreshChallenges}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Workspace as Sheet */}
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent
            side="right"
            className="w-full sm:w-[440px] sm:max-w-[440px] flex flex-col overflow-hidden p-0"
          >
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
              <SheetTitle className="text-steam-dark">
                Darbo erdvė
              </SheetTitle>
              <SheetDescription>
                Kurkite, redaguokite arba generuokite užduotis
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TaskWorkspace
                gameId={game.id}
                gameTitle={game.title}
                gameDescription={game.description}
                challenges={challenges}
                editingChallenge={editingChallenge}
                prefillData={prefillData}
                isCreatingNew={isCreatingNew}
                onEditorSuccess={() => {
                  handleEditorSuccess()
                  setMobileSheetOpen(false)
                }}
                onEditorCancel={() => {
                  handleEditorCancel()
                  setMobileSheetOpen(false)
                }}
                previewChallenge={previewChallenge}
                onClosePreview={() => setPreviewChallenge(null)}
                suggestions={suggestions}
                selectedIds={selectedIds}
                addedIds={addedIds}
                adding={adding}
                diLoading={diLoading}
                diError={diError}
                teacherPrompt={teacherPrompt}
                onTeacherPromptChange={setTeacherPrompt}
                onGenerate={handleGenerate}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onAddSuggestion={handleAddSingle}
                onBulkAdd={handleBulkAdd}
                onReject={handleReject}
                selectedScenario={selectedScenario}
                onScenarioChange={setSelectedScenario}
                onTaskAdded={refreshChallenges}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={null}>
          {activeChallenge && (
            <TaskCardOverlay
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
    </div>
  )
}
