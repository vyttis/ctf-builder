"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { FlaskConical, Monitor, Cog, Palette, Calculator } from "lucide-react"
import { motion } from "framer-motion"

const disciplines = [
  {
    icon: FlaskConical,
    letter: "S",
    name: "Mokslai",
    description: "Duomenų analizė, eksperimentų interpretavimas",
    gradient: "from-secondary/20 to-secondary/5 hover:from-secondary/30 hover:to-secondary/10",
    color: "text-secondary",
    border: "border-secondary/20",
  },
  {
    icon: Monitor,
    letter: "T",
    name: "Technologijos",
    description: "Skaitmeninės užduotys, loginiai sprendimai",
    gradient: "from-primary/20 to-primary/5 hover:from-primary/30 hover:to-primary/10",
    color: "text-primary",
    border: "border-primary/20",
  },
  {
    icon: Cog,
    letter: "E",
    name: "Inžinerija",
    description: "Problemų sprendimas realiomis sąlygomis",
    gradient: "from-steam-dark/15 to-steam-dark/5 hover:from-steam-dark/25 hover:to-steam-dark/8",
    color: "text-steam-dark",
    border: "border-steam-dark/15",
  },
  {
    icon: Palette,
    letter: "A",
    name: "Menas",
    description: "Vizualinės mįslės ir kūrybiniai iššūkiai",
    gradient: "from-accent/20 to-accent/5 hover:from-accent/30 hover:to-accent/10",
    color: "text-accent",
    border: "border-accent/20",
  },
  {
    icon: Calculator,
    letter: "M",
    name: "Matematika",
    description: "Skaičiavimai, modeliavimas, logika",
    gradient: "from-highlight/20 to-highlight/5 hover:from-highlight/30 hover:to-highlight/10",
    color: "text-highlight",
    border: "border-highlight/20",
  },
]

export function SteamIntegrationSection() {
  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Vienas formatas — penkios disciplinos"
        subtitle="CTF formatas lengvai pritaikomas integruotoms STEAM veikloms."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {disciplines.map((d, index) => {
          const Icon = d.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`rounded-2xl border ${d.border} bg-gradient-to-b ${d.gradient} p-5 text-center cursor-default transition-colors`}
            >
              <div className={`text-3xl font-extrabold ${d.color} mb-2 opacity-30`}>
                {d.letter}
              </div>
              <div className={`w-10 h-10 rounded-xl bg-white/60 ${d.color} flex items-center justify-center mx-auto mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-steam-dark text-sm mb-1">
                {d.name}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {d.description}
              </p>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
