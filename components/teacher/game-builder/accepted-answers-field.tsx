"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ChallengeType } from "@/types/game"

/** Same limit as the server (MAX_ACCEPTED_ANSWERS) and the database. */
const MAX = 5

/**
 * Extra answers that also count as correct. Saved ones are hashes, like the
 * main answer, so only their number is shown: new entries replace them, and
 * "Pašalinti" removes them.
 */
export function AcceptedAnswersField({
  fieldId,
  type,
  values,
  onChange,
  savedCount,
  savedForType,
  remove,
  onRemoveChange,
}: {
  fieldId: string
  type: ChallengeType
  values: string[]
  onChange: (values: string[]) => void
  /** How many the saved task has. */
  savedCount: number
  /** False when the type was changed in this edit: the saved ones then go. */
  savedForType: boolean
  remove: boolean
  onRemoveChange: (remove: boolean) => void
}) {
  const hasNew = values.some((v) => v.trim())
  let savedNote: string | null = null
  if (savedCount > 0) {
    if (!savedForType) savedNote = "Pakeitus užduoties tipą, išsaugoti kiti atsakymai bus pašalinti."
    else if (hasNew) savedNote = `Išsaugoti kiti atsakymai (${savedCount}) bus pakeisti įrašytais žemiau.`
    else if (remove) savedNote = "Išsaugoti kiti atsakymai bus pašalinti, kai išsaugosite užduotį."
    else savedNote = `Išsaugoti kiti atsakymai: ${savedCount}. Kaip ir pagrindinio atsakymo, jų parodyti negalima. Įrašę naujus, juos pakeisite.`
  }

  return (
    <div className="space-y-2">
      <Label className="block text-xs font-medium" id={`${fieldId}-accepted-label`}>
        Kiti priimami atsakymai (neprivaloma)
      </Label>
      {savedNote && (
        <p className="text-xs text-muted-foreground">
          {savedNote}
          {savedForType && !hasNew && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 ml-1 text-xs"
              onClick={() => onRemoveChange(!remove)}
            >
              {remove ? "Atšaukti" : "Pašalinti"}
            </Button>
          )}
        </p>
      )}
      {values.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            type={type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
            placeholder={type === "number" ? "Kitas skaičius" : "Kitas atsakymas"}
            aria-label={`Kitas priimamas atsakymas ${i + 1}`}
            className="bg-white flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-accent-ink"
            aria-label={`Pašalinti ${i + 1} kitą atsakymą`}
            onClick={() => onChange(values.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ))}
      {values.length < MAX && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...values, ""])}
          className="gap-1 text-xs"
          aria-describedby={`${fieldId}-accepted-label`}
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Pridėti kitą atsakymą
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        {type === "number"
          ? "Pvz., kai tinka ir apvalintas skaičius. Iki 5."
          : "Pvz. „Vilnius“ ir „Vilniaus miestas“. Kiekvienas tikrinamas taip pat kaip pagrindinis. Iki 5."}
      </p>
    </div>
  )
}
