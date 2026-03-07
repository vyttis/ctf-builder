"use client"

import { useDraggable } from "@dnd-kit/core"
import { AiSuggestion } from "@/lib/ai/types"
import { AiSuggestionCard } from "../ai-suggestion-card"
import { GripVertical } from "lucide-react"

interface DraggableSuggestionCardProps {
  suggestion: AiSuggestion
  index: number
  selected: boolean
  added: boolean
  adding: boolean
  onToggleSelect: (index: number) => void
  onAdd: (index: number) => void
  onEdit?: (index: number) => void
  onReject: (index: number) => void
}

export function DraggableSuggestionCard({
  suggestion,
  index,
  selected,
  added,
  adding,
  onToggleSelect,
  onAdd,
  onEdit,
  onReject,
}: DraggableSuggestionCardProps) {
  const isFailed = suggestion.verification?.verdict === "fail"
  const canDrag = !added && !isFailed

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `suggestion-${index}`,
    disabled: !canDrag,
    data: { type: "suggestion", index, suggestion },
  })

  return (
    <div
      ref={setNodeRef}
      className={`relative group ${isDragging ? "opacity-40" : ""}`}
    >
      {/* Drag handle overlay */}
      {canDrag && (
        <button
          type="button"
          className="absolute left-1 top-4 z-10 p-1 cursor-grab active:cursor-grabbing touch-none rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      <AiSuggestionCard
        suggestion={suggestion}
        index={index}
        selected={selected}
        added={added}
        adding={adding}
        onToggleSelect={onToggleSelect}
        onAdd={onAdd}
        onEdit={onEdit}
        onReject={onReject}
      />
    </div>
  )
}
