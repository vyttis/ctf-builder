"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { BookOpen, EyeOff, UsersRound } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

function PassiveLearningMock() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#F8FAFB] to-white p-4 flex flex-col justify-center gap-3">
      {/* Simulated lecture slide */}
      <div className="bg-white rounded-lg border border-border/30 p-3 shadow-sm">
        <div className="h-2 w-3/4 bg-steam-dark/10 rounded-full mb-2" />
        <div className="h-2 w-1/2 bg-steam-dark/6 rounded-full mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 flex-1 bg-muted/50 rounded" />
          ))}
        </div>
      </div>
      {/* Simulated student rows - passive */}
      <div className="flex gap-2 justify-center opacity-40">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-steam-dark/15" />
        ))}
      </div>
      <div className="text-[9px] text-center text-muted-foreground/50 font-medium">
        Vienpusis informacijos perdavimas
      </div>
    </div>
  )
}

function LowEngagementMock() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#F8FAFB] to-white p-4 flex flex-col justify-center gap-3">
      {/* Attention chart declining */}
      <div className="bg-white rounded-lg border border-border/30 p-3 shadow-sm">
        <div className="text-[9px] font-medium text-muted-foreground/60 mb-2">Dėmesys pamokos metu</div>
        <div className="flex items-end gap-1 h-12">
          {[90, 75, 55, 40, 30, 22, 18].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                backgroundColor: h > 50 ? "hsl(160 100% 41% / 0.3)" : h > 30 ? "hsl(42 95% 63% / 0.4)" : "hsl(348 95% 57% / 0.3)",
              }}
            />
          ))}
        </div>
      </div>
      {/* Engagement indicator */}
      <div className="flex items-center gap-2 justify-center">
        <div className="w-2 h-2 rounded-full bg-accent/50" />
        <div className="text-[9px] text-accent/70 font-medium">Dėmesys krenta</div>
      </div>
    </div>
  )
}

function TeamworkChallengeMock() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#F8FAFB] to-white p-4 flex flex-col justify-center gap-3">
      {/* Scattered planning elements */}
      <div className="bg-white rounded-lg border border-border/30 p-3 shadow-sm">
        <div className="text-[9px] font-medium text-muted-foreground/60 mb-2">Paruošimo laikas</div>
        <div className="flex gap-1.5">
          {["Tema", "Klausimai", "Grupės", "Vertinimas"].map((label) => (
            <div
              key={label}
              className="flex-1 py-1.5 rounded border border-dashed border-border/50 flex items-center justify-center"
            >
              <span className="text-[8px] text-muted-foreground/50">{label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Time indicator */}
      <div className="flex items-center gap-2 justify-center">
        <svg className="w-3 h-3 text-highlight" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <div className="text-[9px] text-highlight font-medium">2–3 val. paruošimo</div>
      </div>
    </div>
  )
}

const problems = [
  {
    icon: BookOpen,
    title: "Pasyvus mokymasis",
    description:
      "Tradicinės pamokos dažnai remiasi vienakrypte informacijos perdavimu, nepaliekant vietos mokinių iniciatyvai.",
    MockComponent: PassiveLearningMock,
  },
  {
    icon: EyeOff,
    title: "Ribotas mokinių įsitraukimas",
    description:
      "Kai trūksta interaktyvumo, mokinių dėmesys ir motyvacija greitai mažėja.",
    MockComponent: LowEngagementMock,
  },
  {
    icon: UsersRound,
    title: "Sunku sukurti komandines veiklas",
    description:
      "Parengti struktūruotą grupinį darbą reikalauja daug laiko ir kūrybinių resursų.",
    MockComponent: TeamworkChallengeMock,
  },
]

export function ProblemSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Šiuolaikinei pamokai reikia daugiau nei pateikties"
        subtitle="Mokiniams reikia aktyvaus dalyvavimo, problemų sprendimo ir tikro įsitraukimo — ne tik klausymosi."
      />

      <div className="grid sm:grid-cols-3 gap-6">
        {problems.map((problem, index) => {
          const Icon = problem.icon
          const Mock = problem.MockComponent
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.14, duration: 0.7 }}
              whileHover={prefersReduced ? {} : { y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-border/40 bg-[#F8FAFB] overflow-hidden group cursor-default"
            >
              <div className="aspect-[3/2] overflow-hidden border-b border-border/20">
                <Mock />
              </div>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-accent/80" />
                </div>
                <h3 className="font-semibold text-steam-dark text-[15px] mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
