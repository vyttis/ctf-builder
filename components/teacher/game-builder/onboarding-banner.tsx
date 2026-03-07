"use client"

import { Sparkles, GripVertical, Edit3, Rocket, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OnboardingBannerProps {
  onDismiss: () => void
}

const steps = [
  {
    icon: Sparkles,
    label: "Sugeneruokite užduotis su DI",
    color: "text-highlight",
    bg: "bg-highlight/10",
  },
  {
    icon: GripVertical,
    label: "Nutempkite jas į žaidimą",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Edit3,
    label: "Redaguokite jei reikia",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Rocket,
    label: "Paleiskite žaidimą",
    color: "text-accent",
    bg: "bg-accent/10",
  },
]

export function OnboardingBanner({ onDismiss }: OnboardingBannerProps) {
  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
      <div className="relative rounded-xl border border-highlight/20 bg-highlight/5 p-4 sm:p-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-steam-dark"
        >
          <X className="h-4 w-4" />
        </Button>

        <p className="text-sm font-semibold text-steam-dark mb-3">
          Kaip sukurti žaidimą?
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div
                className={`shrink-0 w-8 h-8 rounded-lg ${step.bg} flex items-center justify-center`}
              >
                <step.icon className={`h-4 w-4 ${step.color}`} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {i + 1}.
                </span>
                <p className="text-xs text-steam-dark leading-tight">
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
