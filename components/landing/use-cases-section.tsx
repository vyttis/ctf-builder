"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Zap, Users, Search, Brain, Target } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const useCases = [
  {
    icon: Zap,
    title: "Greitam žinių patikrinimui",
    description:
      "Kai reikia greitai įvertinti, kaip mokiniai suprato naują temą.",
    color: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: Users,
    title: "Komandiniams iššūkiams",
    description:
      "Kai norima skatinti bendradarbiavimą, diskusiją ir bendrą sprendimų paiešką.",
    color: "text-secondary",
    bg: "bg-secondary/8",
  },
  {
    icon: Search,
    title: "Tyrimo veikloms",
    description:
      "Kai mokiniai turi analizuoti informaciją, lyginti, ieškoti paaiškinimų ir pagrįsti atsakymus.",
    color: "text-highlight",
    bg: "bg-highlight/8",
  },
  {
    icon: Brain,
    title: "Loginėms užduotims",
    description:
      "Kai svarbu mąstyti nuosekliai, spręsti žingsnis po žingsnio ir taikyti žinias.",
    color: "text-accent",
    bg: "bg-accent/8",
  },
  {
    icon: Target,
    title: "Integruotoms STEAM pamokoms",
    description:
      "Kai viena veikla apjungia kelis dalykus, praktinį taikymą ir problemų sprendimą.",
    color: "text-steam-dark",
    bg: "bg-steam-dark/8",
  },
]

export function UseCasesSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <SectionHeader title="Kokioms veikloms tinka platforma" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
        {useCases.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              whileHover={
                prefersReduced
                  ? {}
                  : { y: -4, transition: { duration: 0.25 } }
              }
              className="rounded-2xl border border-border/40 bg-white p-5 text-center cursor-default transition-shadow hover:shadow-md"
            >
              <div
                className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mx-auto mb-3`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-steam-dark text-sm mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
