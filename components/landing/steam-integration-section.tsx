"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { FlaskConical, Monitor, Cog, Palette, Calculator } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

function SciencePattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="6" fill="currentColor" />
      <ellipse cx="100" cy="100" rx="40" ry="15" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="100" cy="100" rx="40" ry="15" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(60 100 100)" />
      <ellipse cx="100" cy="100" rx="40" ry="15" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(120 100 100)" />
      <circle cx="30" cy="40" r="3" fill="currentColor" />
      <circle cx="170" cy="50" r="2" fill="currentColor" />
      <circle cx="50" cy="160" r="2.5" fill="currentColor" />
      <circle cx="160" cy="155" r="3" fill="currentColor" />
    </svg>
  )
}

function TechPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 200 200">
      <text x="30" y="60" fontSize="24" fill="currentColor" fontFamily="monospace">&lt;/&gt;</text>
      <path d="M 20 120 H 60 V 100 H 100" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 100 140 H 140 V 160 H 180" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="3" fill="currentColor" />
      <circle cx="100" cy="140" r="3" fill="currentColor" />
      <rect x="130" y="50" width="40" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function EngineeringPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 200 200">
      <circle cx="100" cy="90" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="90" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1={100 + 18 * Math.cos((angle * Math.PI) / 180)}
          y1={90 + 18 * Math.sin((angle * Math.PI) / 180)}
          x2={100 + 26 * Math.cos((angle * Math.PI) / 180)}
          y2={90 + 26 * Math.sin((angle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="3"
        />
      ))}
      <line x1="30" y1="150" x2="170" y2="150" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="30" y1="165" x2="120" y2="165" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  )
}

function ArtPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 200 200">
      <ellipse cx="100" cy="100" rx="60" ry="50" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="70" cy="85" r="8" fill="currentColor" />
      <circle cx="100" cy="70" r="6" fill="currentColor" />
      <circle cx="130" cy="85" r="7" fill="currentColor" />
      <circle cx="85" cy="110" r="5" fill="currentColor" />
      <circle cx="115" cy="110" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 30 170 Q 60 150, 90 155 Q 120 160, 170 140" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function MathPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 200 200">
      <line x1="40" y1="30" x2="40" y2="140" stroke="currentColor" strokeWidth="1.5" />
      <line x1="40" y1="140" x2="170" y2="140" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 40 130 Q 70 120, 90 90 Q 110 60, 140 50 Q 155 45, 165 45" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="100" y="180" fontSize="18" fill="currentColor" fontFamily="serif">∑ π ∞</text>
    </svg>
  )
}

const patterns = [SciencePattern, TechPattern, EngineeringPattern, ArtPattern, MathPattern]

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
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Vienas formatas — penkios disciplinos"
        subtitle="CTF formatas lengvai pritaikomas integruotoms STEAM veikloms."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {disciplines.map((d, index) => {
          const Icon = d.icon
          const Pattern = patterns[index]
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              whileHover={prefersReduced ? {} : { y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }}
              className={`relative rounded-2xl border ${d.border} bg-gradient-to-b ${d.gradient} p-5 text-center cursor-default transition-shadow hover:shadow-md overflow-hidden`}
            >
              <Pattern />
              <div className="relative">
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
              </div>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
