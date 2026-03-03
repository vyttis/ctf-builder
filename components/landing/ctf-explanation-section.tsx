"use client"

import { SectionWrapper } from "./section-wrapper"
import { Flag, Users, BarChart3, Puzzle, CheckCircle2, Clock, Trophy } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const features = [
  {
    icon: Puzzle,
    text: "Užduotys pateikiamos kaip iššūkiai",
  },
  {
    icon: Flag,
    text: `Atsakymas \u2014 \u201Eflag\u201C, kur\u012F reikia surasti`,
  },
  {
    icon: Users,
    text: "Galima dirbti komandomis",
  },
  {
    icon: BarChart3,
    text: "Rezultatai matomi realiu laiku",
  },
]

function CtfGameProgressMock() {
  const teams = [
    { name: "Bangų medžiotojai", score: 450, progress: 85, rank: 1 },
    { name: "Kodo meistrai", score: 380, progress: 70, rank: 2 },
    { name: "STEAM komanda", score: 320, progress: 60, rank: 3 },
  ]

  const challenges = [
    { name: "Duomenų mįslė", points: 100, status: "solved" as const },
    { name: "Jūros ekspedicija", points: 150, status: "active" as const },
    { name: "Kodų šifravimas", points: 200, status: "locked" as const },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-steam-dark/5 border border-border/40 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-[#F8FAFB]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-accent/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-highlight/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white rounded h-5 flex items-center justify-center text-[9px] text-muted-foreground/40 font-mono border border-border/30">
            play.ctf-builder.app/game/ABC123
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-steam-dark">Jūros tyrinėtojas CTF</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3 w-3" /> 34:12 liko
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-primary/8 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-semibold text-primary">Gyvai</span>
          </div>
        </div>

        {/* Team leaderboard */}
        <div className="space-y-1.5">
          <div className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Komandų lentelė</div>
          {teams.map((team) => (
            <div key={team.name} className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFB] border border-border/20">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                team.rank === 1 ? "bg-highlight/20 text-highlight" : team.rank === 2 ? "bg-border/40 text-muted-foreground" : "bg-accent/10 text-accent/60"
              }`}>
                {team.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-steam-dark truncate">{team.name}</div>
                <div className="h-1 bg-border/30 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/40"
                    style={{ width: `${team.progress}%` }}
                  />
                </div>
              </div>
              <div className="text-[10px] font-semibold text-steam-dark tabular-nums">{team.score}</div>
            </div>
          ))}
        </div>

        {/* Challenge list */}
        <div className="space-y-1.5">
          <div className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Užduotys</div>
          {challenges.map((ch) => (
            <div key={ch.name} className="flex items-center gap-2 p-2 rounded-lg border border-border/20">
              <div className={`w-6 h-6 rounded flex items-center justify-center ${
                ch.status === "solved" ? "bg-primary/10 text-primary" : ch.status === "active" ? "bg-highlight/10 text-highlight" : "bg-muted text-muted-foreground/40"
              }`}>
                {ch.status === "solved" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : ch.status === "active" ? (
                  <Puzzle className="h-3 w-3" />
                ) : (
                  <div className="w-3 h-3 rounded-sm bg-current opacity-20" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-medium text-steam-dark">{ch.name}</div>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-2.5 w-2.5 text-highlight/50" />
                <span className="text-[9px] text-muted-foreground">{ch.points}</span>
              </div>
              <div className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                ch.status === "solved" ? "bg-primary/10 text-primary" : ch.status === "active" ? "bg-highlight/10 text-highlight" : "bg-muted text-muted-foreground/40"
              }`}>
                {ch.status === "solved" ? "Įvykdyta" : ch.status === "active" ? "Vykdoma" : "Nepradėta"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CtfExplanationSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left — text */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-steam-dark leading-tight mb-4">
            CTF — struktūruotas iššūkis mokymuisi
          </h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
            CTF (Capture The Flag) — tai problemų sprendimo metodas, kai mokiniai
            sprendžia temines užduotis ir už teisingus atsakymus gauna taškus.
            Edukacijoje tai tampa aiškiai struktūruotu, komandiniu mokymosi
            formatu.
          </p>

          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-steam-dark leading-relaxed">
                    {feature.text}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Right — CTF game progress mock */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          {/* Decorative accent */}
          <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
          <div className="absolute -top-3 -left-3 w-16 h-16 bg-secondary/10 rounded-xl -z-10" />
          <CtfGameProgressMock />
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
