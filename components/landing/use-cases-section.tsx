"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Brain, Users, Lightbulb, Target, Puzzle } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const principles = [
  {
    icon: Brain,
    title: "Aktyvus mokymasis",
    description: "Mokiniai ne tik gauna informaciją, bet patys ieško atsakymų ir sprendimų.",
    color: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: Puzzle,
    title: "Problemų sprendimas",
    description: "Užduotys reikalauja mąstyti, analizuoti ir taikyti žinias konkrečiose situacijose.",
    color: "text-secondary",
    bg: "bg-secondary/8",
  },
  {
    icon: Users,
    title: "Bendradarbiavimas",
    description: "Komandinis darbas skatina diskusiją, komunikaciją ir bendrą atsakomybę.",
    color: "text-highlight",
    bg: "bg-highlight/8",
  },
  {
    icon: Lightbulb,
    title: "Kritinis mąstymas",
    description: "Progresinės užuominos ir atviri klausimai skatina gilesnį supratimą.",
    color: "text-accent",
    bg: "bg-accent/8",
  },
  {
    icon: Target,
    title: "STEAM integravimas",
    description: "Formatas tinka tiek atskiriems dalykams, tiek integruotoms STEAM pamokoms.",
    color: "text-steam-dark",
    bg: "bg-steam-dark/8",
  },
]

export function UseCasesSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Kodėl tai veikia mokymuisi"
        subtitle="Platformos veiklos remiasi metodais, kurie skatina gilų mokymąsi — ne tik įsitraukimą."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
        {principles.map((p, index) => {
          const Icon = p.icon
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
                className={`w-12 h-12 rounded-xl ${p.bg} ${p.color} flex items-center justify-center mx-auto mb-3`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-steam-dark text-sm mb-1.5">
                {p.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {p.description}
              </p>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
