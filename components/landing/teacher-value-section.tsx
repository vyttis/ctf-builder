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
    number: "01",
  },
  {
    icon: Layers,
    title: "Leidžia kurti įvairesnes veiklas",
    description:
      "Platforma neapsiriboja tik klausimų rinkiniais, todėl galima kurti įdomesnį ir lankstesnį pamokos scenarijų.",
    color: "text-secondary",
    bg: "bg-secondary/8",
    number: "02",
  },
  {
    icon: TrendingUp,
    title: "Didina mokinių įsitraukimą",
    description:
      "Mokiniai aktyviau dalyvauja pamokoje, kai dirba komandose, sprendžia iššūkius ir mato veiklos eigą.",
    color: "text-highlight",
    bg: "bg-highlight/8",
    number: "03",
  },
  {
    icon: Eye,
    title: "Padeda geriau matyti mokymosi procesą",
    description:
      "Mokytojas gali stebėti ne tik galutinį rezultatą, bet ir visą veiklos eigą.",
    color: "text-accent",
    bg: "bg-accent/8",
    number: "04",
  },
]

export function TeacherValueSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Kodėl ši platforma naudinga mokytojams"
      />

      <div className="grid sm:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {benefits.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="rounded-xl border border-border/50 bg-white p-7 cursor-default transition-all hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden"
            >
              <span className="absolute top-4 right-5 text-[48px] font-extrabold text-steam-dark/[0.03] leading-none select-none">
                {item.number}
              </span>
              <div
                className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-5`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-steam-dark text-base mb-2">
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
