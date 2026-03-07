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
    ctf: "Struktūruotos užduotys su lanksčiu laiko valdymu",
  },
  {
    label: "Darbo būdas",
    quiz: "Individualus žaidimas",
    ctf: "Komandinis darbas",
  },
  {
    label: "Atsakymai",
    quiz: "Pasirinkimas iš variantų",
    ctf: "Laisvas atsakymas arba pasirinkimas",
  },
  {
    label: "Užuominos",
    quiz: "Nėra",
    ctf: "Progresinės, su taškų mažinimu",
  },
  {
    label: "Stebėjimas",
    quiz: "Rezultatai po žaidimo",
    ctf: "Progresas realiu laiku",
  },
  {
    label: "Kūrimas",
    quiz: "Rankinis klausimų vedimas",
    ctf: "DI sugeneruoja pagal temą",
  },
]

export function ComparisonSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Daugiau nei viktorina"
        subtitle="Tradiciniai viktorinų įrankiai tinka greitam patikrinimui. CTF Builder sukurtas giliam, komandiniam mokymuisi."
      />

      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <div className="rounded-2xl border border-border/40 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[140px_1fr_1fr]">
            <div className="hidden sm:block" />
            <div className="px-5 py-4 bg-muted/50 border-b border-r border-border/30">
              <p className="text-sm font-medium text-muted-foreground">
                Tradicinės viktorinos
              </p>
            </div>
            <div className="px-5 py-4 bg-primary/5 border-b border-border/30">
              <p className="text-sm font-semibold text-steam-dark">
                CTF Builder
              </p>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr] sm:grid-cols-[140px_1fr_1fr] border-b last:border-b-0 border-border/20"
            >
              <div className="hidden sm:flex items-center px-5 py-3.5 bg-[#F8FAFB]">
                <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                  {row.label}
                </span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3.5 border-r border-border/20 bg-white">
                <Minus className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {row.quiz}
                </span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3.5 bg-primary/[0.03]">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-sm font-medium text-steam-dark">
                  {row.ctf}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </SectionWrapper>
  )
}
