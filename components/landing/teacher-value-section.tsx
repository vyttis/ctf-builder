"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Clock, Layers, TrendingUp, Eye } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const benefits = [
  {
    icon: Clock,
    title: "Padeda greičiau pasiruošti pamokai",
    description:
      "Mokytojas gali greičiau sukurti veiklą ir lengviau pasiruošti interaktyviai pamokai.",
    color: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: Layers,
    title: "Leidžia kurti įvairesnes veiklas",
    description:
      "Platforma neapsiriboja tik klausimų rinkiniais, todėl galima kurti įdomesnį ir lankstesnį pamokos scenarijų.",
    color: "text-secondary",
    bg: "bg-secondary/8",
  },
  {
    icon: TrendingUp,
    title: "Didina mokinių įsitraukimą",
    description:
      "Mokiniai aktyviau dalyvauja pamokoje, kai dirba komandose, sprendžia iššūkius ir mato veiklos eigą.",
    color: "text-highlight",
    bg: "bg-highlight/8",
  },
  {
    icon: Eye,
    title: "Padeda geriau matyti mokymosi procesą",
    description:
      "Mokytojas gali stebėti ne tik galutinį rezultatą, bet ir visą veiklos eigą.",
    color: "text-accent",
    bg: "bg-accent/8",
  },
]

export function TeacherValueSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Kodėl ši platforma naudinga mokytojams"
      />

      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {benefits.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={
                prefersReduced
                  ? {}
                  : { y: -4, transition: { duration: 0.25 } }
              }
              className="rounded-2xl border border-border/40 bg-muted p-6 cursor-default transition-shadow hover:shadow-md"
            >
              <div
                className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-4`}
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
