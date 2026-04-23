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
    border: "border-l-primary",
  },
  {
    icon: BookOpen,
    title: "Pamokos planas per kelias minutes",
    description:
      "Sudėliokite užduotis į nuoseklią pamokos eigą — tikslai, trukmė, komandos ir refleksija vienoje vietoje.",
    color: "bg-secondary/10 text-secondary",
    border: "border-l-secondary",
  },
  {
    icon: Sparkles,
    title: "Dirbtinio intelekto pagalba",
    description:
      "DI sugeneruoja užduočių idėjas, klausimus, paaiškinimus ir užuominas pagal ugdymo programą — jūs jas redaguojate ir tvirtinate.",
    color: "bg-highlight/10 text-highlight",
    border: "border-l-highlight",
  },
  {
    icon: Users,
    title: "Komandinės veiklos organizavimas",
    description:
      "Įtraukite mokinius į darbą poromis ar komandomis, kad jie spręstų užduotis bendradarbiaudami.",
    color: "bg-accent/10 text-accent",
    border: "border-l-accent",
  },
  {
    icon: Activity,
    title: "Pamokos stebėjimas realiu laiku",
    description:
      "Veiklos metu matykite, kaip sekasi kiekvienai komandai, kurios užduotys atliktos ir kur reikia pagalbos.",
    color: "bg-primary/10 text-primary",
    border: "border-l-primary",
  },
  {
    icon: BarChart3,
    title: "Rezultatų analizė po pamokos",
    description:
      "Peržiūrėkite mokinių atsakymus, atpažinkite sudėtingiausias vietas ir sužinokite, ką verta grįžti aptarti.",
    color: "bg-secondary/10 text-secondary",
    border: "border-l-secondary",
  },
]

export function WhatYouCanDoSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Ką galite nuveikti"
        subtitle="Vienoje platformoje parengsite užduotis, sudėliosite pamokos eigą ir stebėsite, kaip klasė dirba."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {capabilities.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07, duration: 0.5 }}
              className={`rounded-xl border border-border/50 border-l-[3px] ${item.border} bg-white p-6 cursor-default transition-all hover:shadow-lg hover:-translate-y-0.5`}
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
