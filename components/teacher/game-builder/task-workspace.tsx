"use client"

import { Challenge } from "@/types/game"
import { AiSuggestion, ScenarioPreset } from "@/lib/ai/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManualTaskEditor } from "./manual-task-editor"
import { DiWorkspace } from "./di-workspace"
import { LibraryWorkspace } from "./library-workspace"
import { TaskPreview } from "./task-preview"
import { Edit3, Sparkles, BookOpen } from "lucide-react"

interface TaskWorkspaceProps {
  gameId: string
  gameTitle: string
  gameDescription: string | null
  challenges: Challenge[]
  // Editor state
  editingChallenge: Challenge | null
  prefillData: AiSuggestion | null
  isCreatingNew: boolean
  onEditorSuccess: () => void
  onEditorCancel: () => void
  // Preview state
  previewChallenge: Challenge | null
  onClosePreview: () => void
  // DI state
  suggestions: AiSuggestion[]
  selectedIds: Set<number>
  addedIds: Set<number>
  adding: boolean
  diLoading: boolean
  diError: string | null
  teacherPrompt: string
  onTeacherPromptChange: (value: string) => void
  onGenerate: (promptOverride?: string, append?: boolean) => void
  onToggleSelect: (index: number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onAddSuggestion: (index: number) => void
  onBulkAdd: () => void
  onReject: (index: number) => void
  selectedScenario: ScenarioPreset | null
  onScenarioChange: (scenario: ScenarioPreset | null) => void
  // Library
  onTaskAdded: () => void
  // Active tab
  activeTab: string
  onTabChange: (tab: string) => void
}

export function TaskWorkspace({
  gameId,
  gameTitle,
  gameDescription,
  challenges,
  editingChallenge,
  prefillData,
  isCreatingNew,
  onEditorSuccess,
  onEditorCancel,
  previewChallenge,
  onClosePreview,
  suggestions,
  selectedIds,
  addedIds,
  adding,
  diLoading,
  diError,
  teacherPrompt,
  onTeacherPromptChange,
  onGenerate,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onAddSuggestion,
  onBulkAdd,
  onReject,
  selectedScenario,
  onScenarioChange,
  onTaskAdded,
  activeTab,
  onTabChange,
}: TaskWorkspaceProps) {
  // If previewing a challenge, show preview
  if (previewChallenge) {
    return <TaskPreview challenge={previewChallenge} onClose={onClosePreview} />
  }

  // If editing or creating, show the editor
  if (editingChallenge || isCreatingNew) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Edit3 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-steam-dark">
            {editingChallenge ? "Redaguoti užduotį" : "Nauja užduotis"}
          </h3>
        </div>
        <ManualTaskEditor
          gameId={gameId}
          challenge={editingChallenge}
          prefillData={prefillData}
          onSuccess={onEditorSuccess}
          onCancel={onEditorCancel}
        />
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="w-full grid grid-cols-3 mb-4">
        <TabsTrigger value="manual" className="gap-1.5 text-xs">
          <Edit3 className="h-3.5 w-3.5" />
          Rankinis
        </TabsTrigger>
        <TabsTrigger value="di" className="gap-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          DI
        </TabsTrigger>
        <TabsTrigger value="library" className="gap-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5" />
          Biblioteka
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual">
        <div className="text-center py-8">
          <Edit3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Pasirinkite užduotį kairėje pusėje, kad ją redaguotumėte, arba
            sukurkite naują.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="di">
        <DiWorkspace
          gameId={gameId}
          gameTitle={gameTitle}
          gameDescription={gameDescription}
          challenges={challenges}
          suggestions={suggestions}
          selectedIds={selectedIds}
          addedIds={addedIds}
          adding={adding}
          loading={diLoading}
          error={diError}
          teacherPrompt={teacherPrompt}
          onTeacherPromptChange={onTeacherPromptChange}
          onGenerate={onGenerate}
          onToggleSelect={onToggleSelect}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onAdd={onAddSuggestion}
          onBulkAdd={onBulkAdd}
          onReject={onReject}
          selectedScenario={selectedScenario}
          onScenarioChange={onScenarioChange}
        />
      </TabsContent>

      <TabsContent value="library">
        <LibraryWorkspace gameId={gameId} onTaskAdded={onTaskAdded} />
      </TabsContent>
    </Tabs>
  )
}
