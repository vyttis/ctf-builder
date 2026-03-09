"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { CheckCircle2, Minus } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const rows = [
  {
    label: "Formatas",
    quiz: "Greiti klausimai su laikmačiu",
    platform: "Struktūruotos užduotys su lanksčiu laiko valdymu",
  },
  {
    label: "Darbo būdas",
    quiz: "Individualus žaidimas",
    platform: "Komandinis darbas ir bendradarbiavimas",
  },
  {
    label: "Atsakymai",
    quiz: "Pasirinkimas iš variantų",
    platform: "Laisvas atsakymas arba pasirinkimas",
  },
  {
    label: "Pagalba",
    quiz: "Nėra užuominų",
    platform: "Progresinės užuominos su taškų logika",
  },
  {
    label: "Stebėjimas",
    quiz: "Rezultatai po žaidimo",
    platform: "Progresas realiu laiku pamokos metu",
  },
  {
    label: "Kūrimas",
    quiz: "Rankinis klausimų vedimas",
    platform: "DI padėjėjas pasiūlo pagal temą",
  },
]

export function DifferenceSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader title="Daugiau nei paprastas klausimų įrankis" />

      <div className="max-w-3xl mx-auto mb-8">
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-2.5"
        >
          <p className="text-[15px] text-muted-foreground leading-relaxed text-center">
            Daugelis skaitmeninių įrankių leidžia pateikti klausimus ir surinkti
            atsakymus. Ši platforma skirta platesniam tikslui — padėti mokytojui
            sukurti visą interaktyvią mokymosi veiklą su lanksčia struktūra,
            komandinėmis veiklomis ir skirtingais užduočių tipais.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[160px_1fr_1fr]">
            <div className="hidden sm:block bg-[#F6F8FA] border-b border-r border-border/30" />
            <div className="px-6 py-4 bg-[#F6F8FA] border-b border-r border-border/30">
              <p className="text-sm font-medium text-muted-foreground">
                Tradiciniai quiz įrankiai
              </p>
            </div>
            <div className="px-6 py-4 bg-primary/[0.04] border-b border-border/30">
              <p className="text-sm font-bold text-steam-dark">
                Ši platforma
              </p>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr] sm:grid-cols-[160px_1fr_1fr] border-b last:border-b-0 border-border/20"
            >
              <div className="hidden sm:flex items-center px-6 py-4 bg-[#F6F8FA] border-r border-border/20">
                <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {row.label}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-6 py-4 border-r border-border/20 bg-white">
                <Minus className="h-3.5 w-3.5 text-muted-foreground/25 shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {row.quiz}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-6 py-4 bg-primary/[0.02]">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-steam-dark">
                  {row.platform}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </SectionWrapper>
  )
}
