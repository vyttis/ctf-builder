import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, ListChecks } from "lucide-react"

interface ChecklistItem {
  label: string
  done: boolean
  hint?: string
}

interface DraftReadinessChecklistProps {
  challengeCount: number
  tasksNeedingAnswer: number
  hasDescription: boolean
  hasTimeLimit: boolean
}

// Server-renderable readiness checklist shown on draft games: mirrors the
// server-side activation guards plus soft recommendations.
export function DraftReadinessChecklist({
  challengeCount,
  tasksNeedingAnswer,
  hasDescription,
  hasTimeLimit,
}: DraftReadinessChecklistProps) {
  const required: ChecklistItem[] = [
    {
      label: "Pridėta bent viena užduotis",
      done: challengeCount > 0,
      hint: challengeCount === 0 ? "Sukurkite užduotis valdymo skiltyje" : undefined,
    },
    {
      label: "Visos užduotys turi atsakymus",
      done: challengeCount > 0 && tasksNeedingAnswer === 0,
      hint:
        tasksNeedingAnswer > 0
          ? `Atsakymo trūksta: ${tasksNeedingAnswer} užd.`
          : undefined,
    },
  ]

  const recommended: ChecklistItem[] = [
    { label: "Pridėtas veiklos aprašymas", done: hasDescription },
    { label: "Nustatytas laiko limitas", done: hasTimeLimit },
  ]

  const readyToStart = required.every((i) => i.done)

  return (
    <Card
      className={`border ${
        readyToStart ? "border-primary/30 bg-primary/5" : "border-border/50 bg-white"
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          {readyToStart
            ? "Viskas paruošta — galite pradėti žaidimą!"
            : "Pasiruošimas žaidimui"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {[...required, ...recommended].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            )}
            <span className={item.done ? "text-steam-dark" : "text-muted-foreground"}>
              {item.label}
            </span>
            {item.hint && (
              <span className="text-xs text-accent ml-auto">{item.hint}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
