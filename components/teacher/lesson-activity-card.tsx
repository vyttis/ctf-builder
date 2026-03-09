"use client"

import { useState } from "react"
import type { LessonActivity } from "@/lib/ai/lesson-types"
import type { VerificationResult } from "@/lib/ai/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ChevronUp,
  ChevronDown,
  X,
  Pencil,
  Lightbulb,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  MessageSquare,
  BookOpen,
  Play,
} from "lucide-react"

type ActivityWithVerification = LessonActivity & {
  verification?: VerificationResult
}

interface LessonActivityCardProps {
  activity: ActivityWithVerification
  index: number
  total: number
  onUpdate: (updated: ActivityWithVerification) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const ACTIVITY_TYPE_CONFIG = {
  intro: { label: "Įvadas", icon: Play, color: "text-secondary", bg: "bg-secondary/10" },
  challenge: { label: "Užduotis", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
  discussion: { label: "Diskusija", icon: MessageSquare, color: "text-highlight", bg: "bg-highlight/10" },
  reflection: { label: "Refleksija", icon: BookOpen, color: "text-accent", bg: "bg-accent/10" },
}

const DIFFICULTY_CONFIG = {
  easy: { label: "Lengva", className: "bg-primary/10 text-primary border-primary/20" },
  medium: { label: "Vidutinė", className: "bg-highlight/10 text-highlight border-highlight/20" },
  hard: { label: "Sunki", className: "bg-accent/10 text-accent border-accent/20" },
}

const TYPE_LABELS = {
  text: "Tekstas",
  number: "Skaičius",
  multiple_choice: "Pasirinkimas",
}

export function LessonActivityCard({
  activity,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: LessonActivityCardProps) {
  const [expanded, setExpanded] = useState(false)
  const config = ACTIVITY_TYPE_CONFIG[activity.activity_type]
  const diffConfig = DIFFICULTY_CONFIG[activity.difficulty]
  const Icon = config.icon
  const verificationVerdict = activity.verification?.verdict

  return (
    <Card className="border-border/50 bg-white mb-2">
      <CardContent className="p-0">
        {/* Compact view */}
        <div className="flex items-center gap-3 p-3">
          {/* Order number */}
          <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
            {index + 1}
          </div>

          {/* Type badge */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color} shrink-0`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-steam-dark text-sm truncate">
              {activity.title}
            </p>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-xs ${diffConfig.className}`}>
              {diffConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {activity.duration_minutes}m
            </span>
            <span className="text-xs font-medium text-primary">
              {activity.points} tšk.
            </span>

            {/* Verification */}
            {verificationVerdict === "pass" && (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            )}
            {verificationVerdict === "fail" && (
              <AlertCircle className="h-4 w-4 text-accent shrink-0" />
            )}
            {verificationVerdict === "uncertain" && (
              <HelpCircle className="h-4 w-4 text-highlight shrink-0" />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onMoveUp()}
              disabled={index === 0}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onMoveDown()}
              disabled={index === total - 1}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-accent hover:text-accent"
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Description preview (always visible) */}
        {!expanded && (
          <div className="px-3 pb-3 pt-0">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {activity.description}
            </p>
          </div>
        )}

        {/* Expanded edit view */}
        {expanded && (
          <div className="px-3 pb-4 pt-1 border-t border-border/30 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Pavadinimas</Label>
              <Input
                value={activity.title}
                onChange={(e) => onUpdate({ ...activity, title: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Aprašymas / klausimas</Label>
              <Textarea
                value={activity.description}
                onChange={(e) => onUpdate({ ...activity, description: e.target.value })}
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Teisingas atsakymas</Label>
                <Input
                  value={activity.correct_answer}
                  onChange={(e) => onUpdate({ ...activity, correct_answer: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Taškai</Label>
                <Input
                  type="number"
                  value={activity.points}
                  onChange={(e) => onUpdate({ ...activity, points: parseInt(e.target.value, 10) || 100 })}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipas</Label>
                <Badge variant="outline" className="text-xs">
                  {TYPE_LABELS[activity.type]}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Trukmė (min.)</Label>
                <Input
                  type="number"
                  value={activity.duration_minutes}
                  onChange={(e) =>
                    onUpdate({ ...activity, duration_minutes: parseInt(e.target.value, 10) || 5 })
                  }
                  className="text-sm"
                />
              </div>
            </div>

            {/* Options for multiple choice */}
            {activity.type === "multiple_choice" && activity.options && (
              <div className="space-y-1">
                <Label className="text-xs">Atsakymų variantai</Label>
                <div className="space-y-1">
                  {activity.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          opt === activity.correct_answer
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...(activity.options || [])]
                          newOptions[i] = e.target.value
                          onUpdate({ ...activity, options: newOptions })
                        }}
                        className="text-sm h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hints */}
            {activity.hints.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Užuominos ({activity.hints.length})
                </Label>
                <div className="space-y-1">
                  {activity.hints.map((hint, i) => (
                    <Input
                      key={i}
                      value={hint}
                      onChange={(e) => {
                        const newHints = [...activity.hints]
                        newHints[i] = e.target.value
                        onUpdate({ ...activity, hints: newHints })
                      }}
                      className="text-sm h-8"
                      placeholder={`Užuomina ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {activity.explanation && (
              <div className="space-y-1">
                <Label className="text-xs">Paaiškinimas (rodomas po teisingo atsakymo)</Label>
                <Textarea
                  value={activity.explanation}
                  onChange={(e) => onUpdate({ ...activity, explanation: e.target.value })}
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}

            {/* Verification issues */}
            {activity.verification?.issues && activity.verification.issues.length > 0 && (
              <div className="rounded bg-highlight/5 border border-highlight/20 p-2">
                <p className="text-xs font-medium text-highlight mb-1">Patikros pastabos:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {activity.verification.issues.map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
