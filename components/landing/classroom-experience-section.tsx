"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import {
  Settings,
  Users,
  Puzzle,
  Star,
  CheckCircle2,
  Trophy,
  Smartphone,
  Monitor,
  Megaphone,
  Pause,
  Crown,
  Lock,
} from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

function TeacherViewMock() {
  return (
    <div className="w-full bg-gradient-to-br from-[#F6F8FA] to-white p-4 space-y-3">
      {/* Announcement banner */}
      <div className="flex items-center gap-1.5 rounded-lg bg-primary/8 border border-primary/15 px-2.5 py-1.5">
        <Megaphone className="h-3 w-3 text-primary shrink-0" />
        <span className="text-[9px] text-primary font-medium truncate">
          Liko 5 minutės! Paskubėkite su paskutine užduotimi.
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
            <Settings className="h-3 w-3 text-primary" />
          </div>
          <span className="text-[10px] font-semibold text-steam-dark">
            Mokytojo aplinka
          </span>
        </div>
        <div className="flex gap-1">
          <div className="h-5 px-2 bg-accent/8 rounded flex items-center gap-1 cursor-default">
            <Pause className="h-2.5 w-2.5 text-accent" />
            <span className="text-[9px] text-accent font-medium">
              Pristabdyti
            </span>
          </div>
          <div className="h-5 px-2 bg-primary/8 rounded flex items-center">
            <span className="text-[9px] text-primary font-medium">
              3 komandos
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Užduotys", value: "8", icon: Puzzle, color: "text-primary" },
          { label: "Komandos", value: "3", icon: Users, color: "text-secondary" },
          { label: "Pasiekimai", value: "5", icon: Trophy, color: "text-highlight" },
        ].map((kpi) => {
          const KIcon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-lg border border-border/30 p-2.5 text-center shadow-sm"
            >
              <KIcon className={`h-3.5 w-3.5 ${kpi.color} mx-auto mb-1`} />
              <div className="text-sm font-bold text-steam-dark leading-none">
                {kpi.value}
              </div>
              <div className="text-[8px] text-muted-foreground/60 mt-0.5">
                {kpi.label}
              </div>
            </div>
          )
        })}
      </div>
      <div className="space-y-2">
        {[
          { name: "Saulės komanda", pct: 85, barColor: "bg-primary" },
          { name: "Vėjo komanda", pct: 60, barColor: "bg-secondary" },
          { name: "Jūros komanda", pct: 45, barColor: "bg-highlight" },
        ].map((team) => (
          <div key={team.name} className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-20 truncate font-medium">
              {team.name}
            </span>
            <div className="flex-1 h-2 bg-border/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${team.barColor} opacity-50`}
                style={{ width: `${team.pct}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground tabular-nums font-medium">
              {team.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentViewMock() {
  return (
    <div className="w-full bg-gradient-to-br from-[#F6F8FA] to-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-secondary/10 flex items-center justify-center">
            <Puzzle className="h-3 w-3 text-secondary" />
          </div>
          <span className="text-[10px] font-semibold text-steam-dark">
            Mokinio vaizdas
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-highlight" />
          <span className="text-[10px] font-bold text-steam-dark">280 tšk</span>
        </div>
      </div>

      {/* Achievement notification */}
      <div className="flex items-center gap-1.5 rounded-lg bg-highlight/8 border border-highlight/15 px-2.5 py-1.5">
        <Crown className="h-3 w-3 text-highlight shrink-0" />
        <span className="text-[9px] text-highlight font-medium">
          Pasiekimas: Pirmi išsprendėte &bdquo;Jūros ekosistema&ldquo;!
        </span>
      </div>

      {[
        { name: "Jūros ekosistema", pts: 100, done: true, difficulty: "Lengva", diffColor: "text-primary bg-primary/8", achievement: true },
        { name: "Klimato pokyčiai", pts: 150, done: true, difficulty: "Vidutinė", diffColor: "text-highlight bg-highlight/8", achievement: false },
        { name: "Energijos šaltiniai", pts: 200, done: false, difficulty: "Sunki", diffColor: "text-accent bg-accent/8", locked: true },
      ].map((ch) => (
        <div
          key={ch.name}
          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-border/30 shadow-sm"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              ch.done ? "bg-primary/10" : ch.locked ? "bg-muted" : "bg-muted"
            }`}
          >
            {ch.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            ) : ch.locked ? (
              <Lock className="h-3 w-3 text-muted-foreground/40" />
            ) : (
              <Puzzle className="h-3 w-3 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-steam-dark">
              {ch.name}
            </div>
            {ch.locked && (
              <div className="text-[8px] text-muted-foreground/50 mt-0.5">
                Reikia išspręsti ankstesnę
              </div>
            )}
          </div>
          <span className={`text-[8px] font-medium ${ch.diffColor} px-1.5 py-0.5 rounded`}>
            {ch.difficulty}
          </span>
          {ch.achievement && (
            <Crown className="h-3 w-3 text-highlight shrink-0" />
          )}
          <div className="flex items-center gap-0.5">
            <Trophy className="h-3 w-3 text-highlight/50" />
            <span className="text-[9px] text-muted-foreground">{ch.pts}</span>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <div className="flex-1 h-8 rounded-lg border border-border/30 bg-white flex items-center px-2.5 shadow-sm">
          <span className="text-[10px] text-muted-foreground/40">
            Įveskite atsakymą...
          </span>
        </div>
        <div className="h-8 px-3 rounded-lg bg-primary/10 flex items-center">
          <span className="text-[10px] font-semibold text-primary">
            Tikrinti
          </span>
        </div>
      </div>
    </div>
  )
}

export function ClassroomExperienceSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Kaip tai atrodo pamokoje"
        subtitle="Mokiniai sprendžia, analizuoja ir diskutuoja komandose — o mokytojas valdo eigą, siunčia pranešimus ir mato viską realiu laiku."
      />

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Teacher view */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-steam-dark">
              Mokytojo aplinka
            </span>
          </div>
          <div className="relative group">
            <div className="absolute -inset-3 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative rounded-xl border border-border/50 bg-white overflow-hidden shadow-lg shadow-steam-dark/5 transition-shadow group-hover:shadow-xl">
              <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/30 bg-[#F6F8FA]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-highlight/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md h-5 flex items-center justify-center text-[9px] text-muted-foreground/40 font-mono border border-border/30">
                    app.kusteam.lt
                  </div>
                </div>
              </div>
              <TeacherViewMock />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center font-medium">
            Valdymo centras su pranešimais, pauze ir progreso stebėjimu
          </p>
        </motion.div>

        {/* Student view */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-secondary" />
            <span className="text-sm font-semibold text-steam-dark">
              Mokinio vaizdas
            </span>
          </div>
          <div className="relative group">
            <div className="absolute -inset-3 bg-gradient-to-br from-secondary/10 via-transparent to-highlight/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative rounded-xl border border-border/50 bg-white overflow-hidden shadow-lg shadow-steam-dark/5 transition-shadow group-hover:shadow-xl">
              <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/30 bg-[#F6F8FA]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-highlight/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md h-5 flex items-center justify-center text-[9px] text-muted-foreground/40 font-mono border border-border/30">
                    play.kusteam.lt
                  </div>
                </div>
              </div>
              <StudentViewMock />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center font-medium">
            Pasiekimai, sudėtingumo lygiai ir užduočių priklausomybės
          </p>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
