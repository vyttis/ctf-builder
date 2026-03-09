"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import {
  Puzzle,
  BookOpen,
  Sparkles,
  Users,
  Activity,
  BarChart3,
} from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const capabilities = [
  {
    icon: Puzzle,
    title: "Interaktyvių užduočių kūrimas",
    description:
      "Kurkite skirtingų tipų užduotis: klausimus, loginius iššūkius, komandines veiklas, tyrimo scenarijus ir diskusijomis paremtas užduotis.",
    color: "bg-primary/10 text-primary",
    accent: "border-l-primary",
  },
  {
    icon: BookOpen,
    title: "Pamokos scenarijaus sudarymas",
    description:
      "Sujunkite užduotis į nuoseklią pamokos eigą, pritaikytą konkrečiai temai, klasei ir mokymosi tikslui.",
    color: "bg-secondary/10 text-secondary",
    accent: "border-l-secondary",
  },
  {
    icon: Sparkles,
    title: "Dirbtinio intelekto pagalba",
    description:
      "Greitai generuokite užduočių idėjas, klausimus, paaiškinimus ir užuominas, kuriuos vėliau galima redaguoti ir pritaikyti.",
    color: "bg-highlight/10 text-highlight",
    accent: "border-l-highlight",
  },
  {
    icon: Users,
    title: "Komandinės veiklos organizavimas",
    description:
      "Įtraukite mokinius į darbą poromis ar komandomis, kad jie spręstų užduotis bendradarbiaudami.",
    color: "bg-accent/10 text-accent",
    accent: "border-l-accent",
  },
  {
    icon: Activity,
    title: "Pamokos stebėjimas realiu laiku",
    description:
      "Veiklos metu matykite, kaip sekasi komandoms ar mokiniams, kurios užduotys jau atliktos ir kur kyla daugiausia sunkumų.",
    color: "bg-primary/10 text-primary",
    accent: "border-l-primary",
  },
  {
    icon: BarChart3,
    title: "Rezultatų peržiūra po veiklos",
    description:
      "Analizuokite mokinių atsakymus, peržiūrėkite sudėtingiausias vietas ir geriau supraskite, ką verta aptarti dar kartą.",
    color: "bg-secondary/10 text-secondary",
    accent: "border-l-secondary",
  },
]

export function WhatYouCanDoSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Ką galima daryti platformoje"
        subtitle="Platforma leidžia mokytojui vienoje vietoje kurti, organizuoti ir valdyti interaktyvias mokymosi veiklas."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {capabilities.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className={`rounded-2xl border border-border/40 border-l-4 ${item.accent} bg-white p-6 cursor-default transition-shadow hover:shadow-md`}
            >
              <div
                className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center mb-4`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-steam-dark text-[15px] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
