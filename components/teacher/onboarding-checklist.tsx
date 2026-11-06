import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CreateSampleGameButton } from "./create-sample-game-button"
import { CheckCircle2, Circle, Rocket, ChevronRight } from "lucide-react"

export interface OnboardingStep {
  label: string
  done: boolean
  href: string
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[]
  // Offer the one-click demo game while the teacher has nothing to work with
  showSampleGameButton: boolean
}

// First-success checklist on the dashboard. State is derived from the
// teacher's actual data (no persistence) — it disappears once all steps are
// done and never comes back.
export function OnboardingChecklist({
  steps,
  showSampleGameButton,
}: OnboardingChecklistProps) {
  const doneCount = steps.filter((s) => s.done).length
  const progress = Math.round((doneCount / steps.length) * 100)

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-white mb-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary-ink" />
            Pirmieji žingsniai
          </CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {doneCount} / {steps.length}
          </span>
        </div>
        <Progress value={Math.round(progress)} className="h-1.5 mt-2" aria-label="Pirmųjų žingsnių eiga" />
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step, index) => {
          const isNext = !step.done && steps.slice(0, index).every((s) => s.done)
          return (
            <Link
              key={step.label}
              href={step.href}
              className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors ${
                step.done
                  ? "text-muted-foreground"
                  : isNext
                  ? "bg-primary/5 text-steam-dark font-medium hover:bg-primary/10"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-primary-ink shrink-0" />
              ) : (
                <Circle
                  className={`h-4 w-4 shrink-0 ${
                    isNext ? "text-primary-ink" : "text-muted-foreground/40"
                  }`}
                />
              )}
              <span className={step.done ? "line-through decoration-muted-foreground/40" : ""}>
                {index + 1}. {step.label}
              </span>
              {isNext && <ChevronRight className="h-4 w-4 text-primary-ink ml-auto shrink-0" />}
            </Link>
          )
        })}

        {showSampleGameButton && (
          <div className="pt-3 mt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1">
              Norite greitai išbandyti? Sukursime paruoštą veiklą su 3
              užduotimis, beliks tik pradėti.
            </p>
            <CreateSampleGameButton size="sm" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
