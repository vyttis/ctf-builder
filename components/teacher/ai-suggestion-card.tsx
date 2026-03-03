"use client"

import { AiSuggestion } from "@/lib/ai/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Plus, X, Lightbulb, CheckCircle2 } from "lucide-react"

const typeLabels: Record<string, string> = {
  text: "Tekstas",
  number: "Skaičius",
  multiple_choice: "Pasirinkimas",
}

interface AiSuggestionCardProps {
  suggestion: AiSuggestion
  index: number
  onAccept: (suggestion: AiSuggestion) => void
  onReject: (index: number) => void
}

export function AiSuggestionCard({
  suggestion,
  index,
  onAccept,
  onReject,
}: AiSuggestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-l-4 border-l-highlight border-border/50 bg-white">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-steam-dark text-sm leading-tight">
              {suggestion.title}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className="text-xs">
                {suggestion.points} tšk.
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {typeLabels[suggestion.type] || suggestion.type}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {suggestion.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {suggestion.description}
            </p>
          )}

          {/* Answer */}
          <div className="flex items-center gap-1.5 p-2 rounded-md bg-primary/5 border border-primary/10">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium text-steam-dark">
              Atsakymas: {suggestion.correct_answer}
            </span>
          </div>

          {/* Options (for multiple choice) */}
          {suggestion.type === "multiple_choice" && suggestion.options && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                Variantai:
              </p>
              <div className="flex flex-wrap gap-1">
                {suggestion.options.map((opt, i) => (
                  <Badge
                    key={i}
                    variant={
                      opt === suggestion.correct_answer ? "default" : "outline"
                    }
                    className="text-xs"
                  >
                    {opt}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Hints */}
          {suggestion.hints.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-highlight shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                {suggestion.hints.map((hint, i) => (
                  <span key={i}>
                    {hint}
                    {i < suggestion.hints.length - 1 && " • "}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => onAccept(suggestion)}
              className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Pridėti
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReject(index)}
              className="text-muted-foreground hover:text-accent gap-1.5 text-xs h-8"
            >
              <X className="h-3.5 w-3.5" />
              Atmesti
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
