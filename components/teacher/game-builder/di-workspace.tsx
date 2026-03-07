"use client"

import { Challenge } from "@/types/game"
import { AiSuggestion, ScenarioPreset } from "@/lib/ai/types"
import { SuggestionsPanel } from "../challenge-builder/suggestions-panel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Zap,
  Search,
  DoorOpen,
  MessageSquare,
} from "lucide-react"

const scenarios: {
  id: ScenarioPreset
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    id: "quick_check",
    label: "Greitas patikrinimas",
    description: "Trumpi faktiniai klausimai, 1-2 min. kiekvienam",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "investigation",
    label: "Komandinis tyrimas",
    description: "Tyrinėjimo užduotys, reikalaujančios kelių žingsnių",
    icon: <Search className="h-5 w-5" />,
  },
  {
    id: "escape_room",
    label: "Pabėgimo kambarys",
    description: "Nuoseklios galvosūkiai, kiekvienas atrakiną kitą",
    icon: <DoorOpen className="h-5 w-5" />,
  },
  {
    id: "discussion",
    label: "Diskusijos pamoka",
    description: "Atviri klausimai, skatinantys mąstymą",
    icon: <MessageSquare className="h-5 w-5" />,
  },
]

interface DiWorkspaceProps {
  gameId: string
  gameTitle: string
  gameDescription: string | null
  challenges: Challenge[]
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
  onEdit?: (index: number) => void
  onBulkAdd: () => void
  onReject: (index: number) => void
  selectedScenario: ScenarioPreset | null
  onScenarioChange: (scenario: ScenarioPreset | null) => void
  generationSuccess?: number | null
}

export function DiWorkspace({
  gameTitle,
  gameDescription,
  challenges,
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
  onEdit,
  onBulkAdd,
  onReject,
  selectedScenario,
  onScenarioChange,
  generationSuccess,
}: DiWorkspaceProps) {
  return (
    <div className="space-y-4">
      {/* Scenario presets */}
      {suggestions.length === 0 && !loading && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Pasirinkite scenarijų (neprivaloma)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {scenarios.map((s) => (
              <Card
                key={s.id}
                className={`cursor-pointer transition-all hover:border-highlight/40 ${
                  selectedScenario === s.id
                    ? "border-highlight ring-1 ring-highlight/20 bg-highlight/5"
                    : "border-border/50"
                }`}
                onClick={() =>
                  onScenarioChange(selectedScenario === s.id ? null : s.id)
                }
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div
                      className={`shrink-0 ${
                        selectedScenario === s.id
                          ? "text-highlight"
                          : "text-muted-foreground"
                      }`}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-steam-dark">
                        {s.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {selectedScenario && (
            <Badge
              variant="outline"
              className="text-xs text-highlight border-highlight/30"
            >
              Scenarijus: {scenarios.find((s) => s.id === selectedScenario)?.label}
            </Badge>
          )}
        </div>
      )}

      {/* Suggestions Panel */}
      <SuggestionsPanel
        gameTitle={gameTitle}
        gameDescription={gameDescription}
        existingChallenges={challenges}
        suggestions={suggestions}
        selectedIds={selectedIds}
        addedIds={addedIds}
        adding={adding}
        loading={loading}
        error={error}
        teacherPrompt={teacherPrompt}
        onTeacherPromptChange={onTeacherPromptChange}
        onGenerate={onGenerate}
        onToggleSelect={onToggleSelect}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        onAdd={onAdd}
        onEdit={onEdit}
        onBulkAdd={onBulkAdd}
        onReject={onReject}
        generationSuccess={generationSuccess}
      />
    </div>
  )
}
