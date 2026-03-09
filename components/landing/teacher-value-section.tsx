"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Clock, Layers, TrendingUp, Eye } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const benefits = [
  {
    icon: Clock,
    title: "Mažiau laiko pasiruošimui",
    description:
      "Veikla sukuriama greičiau, o pasiruošimas interaktyviai pamokai užima mažiau laiko nei įprasta.",
    color: "text-primary",
    bg: "bg-primary/8",
    number: "01",
  },
  {
    icon: Layers,
    title: "Daugiau nei tik klausimai",
    description:
      "Galima derinti skirtingus užduočių tipus, veiklos etapus ir komandines užduotis — ne vien klausimų rinkinius.",
    color: "text-secondary",
    bg: "bg-secondary/8",
    number: "02",
  },
  {
    icon: TrendingUp,
    title: "Aktyvesni mokiniai",
    description:
      "Komandos, iššūkiai ir matoma veiklos eiga skatina mokinius dalyvauti, o ne tik klausytis.",
    color: "text-highlight",
    bg: "bg-highlight/8",
    number: "03",
  },
  {
    icon: Eye,
    title: "Visas procesas kaip ant delno",
    description:
      "Matomas ne tik galutinis rezultatas, bet ir kiekvienas žingsnis — kur sekėsi, kur strigo.",
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
        title="Nauda mokytojui"
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
