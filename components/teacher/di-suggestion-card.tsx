"use client"

import { useState } from "react"
import { AiSuggestion } from "@/lib/ai/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import {
  Plus,
  X,
  Lightbulb,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
} from "lucide-react"

const typeLabels: Record<string, string> = {
  text: "Tekstas",
  number: "Skaičius",
  multiple_choice: "Pasirinkimas",
}

interface DiSuggestionCardProps {
  suggestion: AiSuggestion
  index: number
  selected: boolean
  added: boolean
  onToggleSelect: (index: number) => void
  onAccept: (suggestion: AiSuggestion) => void
  onReject: (index: number) => void
}

function VerificationBadge({
  suggestion,
}: {
  suggestion: AiSuggestion
}) {
  const verification = suggestion.verification

  if (!verification) {
    return null
  }

  switch (verification.verdict) {
    case "pass":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 text-xs">
          <ShieldCheck className="h-3 w-3" />
          Patikrinta
        </Badge>
      )
    case "uncertain":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 text-xs">
          <ShieldQuestion className="h-3 w-3" />
          Reikia peržiūros
        </Badge>
      )
    case "fail":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-xs">
          <ShieldAlert className="h-3 w-3" />
          Klaida
        </Badge>
      )
  }
}

export function DiSuggestionCard({
  suggestion,
  index,
  selected,
  added,
  onToggleSelect,
  onAccept,
  onReject,
}: DiSuggestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false)
  const [showVerificationDetails, setShowVerificationDetails] = useState(false)

  const isFailed = suggestion.verification?.verdict === "fail"
  const isUncertain = suggestion.verification?.verdict === "uncertain"
  const hasIssues =
    suggestion.verification?.issues &&
    suggestion.verification.issues.length > 0

  const borderColor = added
    ? "border-l-emerald-500"
    : isFailed
    ? "border-l-red-400"
    : isUncertain
    ? "border-l-amber-400"
    : "border-l-highlight"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={`border-l-4 ${borderColor} border-border/50 bg-white ${
          added ? "opacity-60" : ""
        }`}
      >
        <CardContent className="p-4 space-y-3">
          {/* Top row: checkbox + header */}
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            {!added && (
              <div className="pt-0.5">
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggleSelect(index)}
                  disabled={isFailed}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-steam-dark text-sm leading-tight">
                  {added && (
                    <Check className="h-3.5 w-3.5 inline-block mr-1 text-emerald-600" />
                  )}
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

              {/* Verification badge */}
              <div className="flex items-center gap-2 mt-1.5">
                <VerificationBadge suggestion={suggestion} />
                {added && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                    Pridėta
                  </Badge>
                )}
              </div>
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
                    {i < suggestion.hints.length - 1 && " \u2022 "}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible: Explanation */}
          {suggestion.explanation && (
            <div>
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
                Rodyti paaiškinimą
              </button>
              {showExplanation && (
                <p className="text-xs text-muted-foreground mt-1 pl-4 border-l-2 border-secondary/20">
                  {suggestion.explanation}
                </p>
              )}
            </div>
          )}

          {/* Collapsible: Verification details */}
          {hasIssues && (
            <div>
              <button
                type="button"
                onClick={() =>
                  setShowVerificationDetails(!showVerificationDetails)
                }
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                {showVerificationDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Rodyti patikros detales
              </button>
              {showVerificationDetails && (
                <div className="mt-1 pl-4 border-l-2 border-amber-200 space-y-1">
                  {suggestion.verification!.issues.map((issue, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1 text-xs text-amber-700"
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      {issue}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Patikimumas:{" "}
                    {Math.round(
                      (suggestion.verification!.confidence || 0) * 100
                    )}
                    %
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Uncertain warning */}
          {isUncertain && !added && (
            <div className="flex items-start gap-1.5 p-2 rounded-md bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-xs text-amber-700">
                Patikra neaiški — peržiūrėkite atsakymą prieš pridėdami
              </span>
            </div>
          )}

          {/* Actions */}
          {!added && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => onAccept(suggestion)}
                disabled={isFailed}
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
