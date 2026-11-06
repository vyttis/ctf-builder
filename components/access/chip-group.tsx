"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface ChipGroupProps<T extends string> {
  legend: string
  hint?: string
  options: readonly T[]
  value: T[]
  onChange: (value: T[]) => void
  invalid?: boolean
}

/** Multi-select as toggle chips: easier to tap on a phone than checkboxes. */
export function ChipGroup<T extends string>({ legend, hint, options, value, onChange, invalid }: ChipGroupProps<T>) {
  const selected = new Set(value)
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-steam-dark">{legend}</legend>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className={cn("flex flex-wrap gap-2", invalid && "rounded-lg outline outline-1 outline-destructive outline-offset-4")}>
        {options.map((option) => {
          const on = selected.has(option)
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== option) : [...value, option])}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on
                  ? "border-primary bg-primary/15 text-steam-dark"
                  : "border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-steam-dark",
              )}
            >
              {on && <Check className="h-3.5 w-3.5 text-primary-ink" aria-hidden="true" />}
              {option}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
