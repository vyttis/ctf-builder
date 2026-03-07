"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Users, Puzzle, BarChart3, Flag, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

function TeamworkMock() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#F8FAFB] to-white p-4 flex flex-col justify-center gap-3">
      {/* Team circles with connections */}
      <div className="relative flex justify-center items-center py-2">
        <div className="flex gap-3 items-center">
          {["bg-primary/20", "bg-secondary/20", "bg-highlight/20"].map(
            (color, i) => (
              <div key={i} className="relative">
                <div
                  className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}
                >
                  <Users className="h-4 w-4 text-steam-dark/40" />
                </div>
                {i < 2 && (
                  <div className="absolute top-1/2 -right-3 w-3 h-px bg-border/60" />
                )}
              </div>
            )
          )}
        </div>
      </div>
      <div className="text-center space-y-1">
        <div className="text-[10px] font-medium text-steam-dark">
          3 komandos sprendžia kartu
        </div>
        <div className="flex justify-center gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ChallengeMock() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#F8FAFB] to-white p-4 flex flex-col justify-center gap-2.5">
      {/* Challenge card */}
      <div className="bg-white rounded-lg border border-border/30 p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
            <Puzzle className="h-3 w-3 text-primary" />
          </div>
          <div className="text-[10px] font-medium text-steam-dark">
            Jūros ekspedicija
          </div>
          <div className="ml-auto text-[9px] font-semibold text-primary bg-primary/8 px-1.5 py-0.5 rounded">
            200 tšk
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1 h-6 rounded border border-border/30 bg-[#F8FAFB] flex items-center px-2">
            <span className="text-[9px] text-muted-foreground/40 flex items-center gap-1">
              <Flag className="h-2.5 w-2.5" />
              Įveskite flag...
            </span>
          </div>
          <div className="h-6 px-2 rounded bg-primary flex items-center">
            <CheckCircle2 className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>
      <div className="text-[9px] text-center text-muted-foreground/50 font-medium">
        Konkretus iššūkis su aiškiu atsakymu
      </div>
    </div>
  )
}

function MonitoringMock() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#F8FAFB] to-white p-4 flex flex-col justify-center gap-3">
      {/* Live progress bars */}
      <div className="bg-white rounded-lg border border-border/30 p-3 shadow-sm space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-medium text-muted-foreground/60">
            Realiu laiku
          </span>
        </div>
        {[
          { name: "Alfa", pct: 85, color: "bg-primary" },
          { name: "Beta", pct: 55, color: "bg-secondary" },
          { name: "Gama", pct: 30, color: "bg-highlight" },
        ].map((team) => (
          <div key={team.name} className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-8 truncate">
              {team.name}
            </span>
            <div className="flex-1 h-1.5 bg-border/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${team.color}/40`}
                style={{ width: `${team.pct}%` }}
              />
            </div>
            <span className="text-[8px] text-muted-foreground tabular-nums w-6 text-right">
              {team.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const values = [
  {
    icon: Users,
    title: "Komandinis darbas",
    description:
      "Mokiniai dirba grupėse, sprendžia užduotis kartu ir mokosi iš vienas kito.",
    MockComponent: TeamworkMock,
  },
  {
    icon: Puzzle,
    title: "Struktūruoti iššūkiai",
    description:
      "Kiekviena užduotis turi aiškų tikslą, atsakymą ir taškus — ne atviras klausimas, o konkretus iššūkis.",
    MockComponent: ChallengeMock,
  },
  {
    icon: BarChart3,
    title: "Realaus laiko stebėjimas",
    description:
      "Matote kiekvienos komandos progresą, atsakymus ir rezultatus pamokos metu.",
    MockComponent: MonitoringMock,
  },
]

export function ValueSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Ne viktorina. Ne testas. Struktūruotas komandinis iššūkis."
        subtitle="CTF (Capture The Flag) formatas paverčia bet kurią pamoką aktyviu, komandiniu mokymosi procesu su aiškia struktūra."
      />

      <div className="grid sm:grid-cols-3 gap-6">
        {values.map((value, index) => {
          const Icon = value.icon
          const Mock = value.MockComponent
          return (
            <motion.div
              key={index}
              initial={
                prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.14, duration: 0.7 }}
              whileHover={
                prefersReduced
                  ? {}
                  : { y: -4, transition: { duration: 0.2 } }
              }
              className="rounded-2xl border border-border/40 bg-[#F8FAFB] overflow-hidden group cursor-default"
            >
              <div className="aspect-[3/2] overflow-hidden border-b border-border/20">
                <Mock />
              </div>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-steam-dark text-[15px] mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
