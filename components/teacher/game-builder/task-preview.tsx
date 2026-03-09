"use client"

import { Challenge } from "@/types/game"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Eye,
  Lightbulb,
  MapPin,
  Image as ImageIcon,
  ChevronRight,
  X,
} from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { MapsEmbed } from "@/components/shared/maps-embed"

interface TaskPreviewProps {
  challenge: Challenge
  onClose: () => void
}

export function TaskPreview({ challenge, onClose }: TaskPreviewProps) {
  const [revealedHints, setRevealedHints] = useState(0)

  const typeLabel =
    challenge.type === "text"
      ? "Tekstas"
      : challenge.type === "number"
      ? "Skaičius"
      : "Pasirinkimas"

  const difficultyLabel =
    challenge.difficulty === "easy"
      ? "Lengva"
      : challenge.difficulty === "medium"
      ? "Vidutinė"
      : challenge.difficulty === "hard"
      ? "Sunki"
      : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-secondary" />
          <h3 className="font-semibold text-sm text-steam-dark">
            Mokinio vaizdas
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Card className="border-border/50 bg-gradient-to-br from-white to-muted/20 overflow-hidden">
        <CardContent className="p-4 space-y-4">
          {/* Title and badges */}
          <div>
            <h2 className="text-lg font-bold text-steam-dark">
              {challenge.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {challenge.points} tšk.
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {typeLabel}
              </Badge>
              {difficultyLabel && (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    challenge.difficulty === "easy"
                      ? "text-primary border-primary/30"
                      : challenge.difficulty === "hard"
                      ? "text-accent border-accent/30"
                      : "text-highlight border-highlight/30"
                  }`}
                >
                  {difficultyLabel}
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {challenge.description && (
            <p className="text-sm text-steam-dark/80 whitespace-pre-wrap">
              {challenge.description}
            </p>
          )}

          {/* Image */}
          {challenge.image_url && (
            <div className="rounded-lg overflow-hidden border border-border/30">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 text-xs text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                Paveiksliukas
              </div>
              
              <Image src={challenge.image_url} alt={challenge.title} width={800} height={192} className="w-full max-h-48 object-contain bg-white" unoptimized />
            </div>
          )}

          {/* Maps */}
          {challenge.maps_url && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                Žemėlapis
              </div>
              <MapsEmbed
                url={challenge.maps_url}
                className="rounded-lg overflow-hidden"
              />
            </div>
          )}

          {/* Answer input preview */}
          <div className="space-y-2">
            {challenge.type === "multiple_choice" && challenge.options ? (
              <div className="space-y-2">
                {challenge.options.map((option, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left p-3 rounded-lg border border-border/50 bg-white hover:border-primary/30 transition-colors text-sm"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-border/50 bg-white text-sm text-muted-foreground">
                {challenge.type === "number"
                  ? "Įveskite skaičių..."
                  : "Įveskite atsakymą..."}
              </div>
            )}
          </div>

          {/* Hints */}
          {challenge.hints.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-highlight border-highlight/30 hover:bg-highlight/5"
                onClick={() =>
                  setRevealedHints((prev) =>
                    Math.min(prev + 1, challenge.hints.length)
                  )
                }
                disabled={revealedHints >= challenge.hints.length}
              >
                <Lightbulb className="h-3 w-3" />
                {revealedHints >= challenge.hints.length
                  ? "Visos užuominos atskleistos"
                  : `Užuomina (${revealedHints}/${challenge.hints.length})`}
                {challenge.hint_penalty > 0 &&
                  revealedHints < challenge.hints.length && (
                    <span className="text-accent ml-1">
                      -{challenge.hint_penalty} tšk.
                    </span>
                  )}
              </Button>
              {revealedHints > 0 && (
                <div className="space-y-1.5">
                  {challenge.hints.slice(0, revealedHints).map((hint, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-highlight/5 border border-highlight/10"
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-highlight shrink-0 mt-0.5" />
                      <p className="text-xs text-steam-dark/80">{hint}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Explanation preview */}
          {challenge.explanation && (
            <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/20">
              <p className="text-xs font-medium text-secondary mb-1">
                Paaiškinimas (rodomas po teisingo atsakymo)
              </p>
              <p className="text-xs text-steam-dark/70">
                {challenge.explanation}
              </p>
            </div>
          )}

          {/* Submit button preview */}
          <Button className="w-full bg-primary hover:bg-primary/90 text-white gap-2">
            Atsakyti
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
