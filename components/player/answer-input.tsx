"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface AnswerInputProps {
  type: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/**
 * The typed answer field for text and number tasks. Phones must not change
 * the answer on their own (autocorrect, capitals, spell check), and the
 * keyboard should not open over the task text before the team has read it.
 * Number tasks get the decimal keypad plus a sign button, because the iPhone
 * decimal keypad has no minus key.
 */
export function AnswerInput({ type, value, onChange, disabled }: AnswerInputProps) {
  const isNumber = type === "number"

  function toggleSign() {
    const trimmed = value.trimStart()
    onChange(trimmed.startsWith("-") || trimmed.startsWith("−") ? trimmed.slice(1) : `-${trimmed}`)
  }

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        inputMode={isNumber ? "decimal" : "text"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="send"
        aria-label={isNumber ? "Atsakymas (skaičius)" : "Atsakymas"}
        placeholder={isNumber ? "Pvz. 2,5" : "Jūsų atsakymas..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 flex-1 bg-white text-base"
        disabled={disabled}
      />
      {isNumber && (
        <Button
          type="button"
          variant="outline"
          onClick={toggleSign}
          disabled={disabled}
          aria-label="Pakeisti skaičiaus ženklą (minusas)"
          className="h-12 w-12 shrink-0 text-lg font-semibold"
        >
          ±
        </Button>
      )}
    </div>
  )
}
