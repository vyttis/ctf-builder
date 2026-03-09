"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import {
  Settings,
  Users,
  BarChart3,
  Puzzle,
  Star,
  CheckCircle2,
  Trophy,
  Smartphone,
  Monitor,
} from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

function TeacherViewMock() {
  return (
    <div className="w-full bg-gradient-to-br from-muted to-white p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
            <Settings className="h-3 w-3 text-primary" />
          </div>
          <span className="text-[9px] font-semibold text-steam-dark">
            Mokytojo aplinka
          </span>
        </div>
        <div className="flex gap-1">
          <div className="h-4 px-1.5 bg-primary/8 rounded flex items-center">
            <span className="text-[8px] text-primary font-medium">
              3 komandos
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Užduotys", value: "8", icon: Puzzle, color: "text-primary" },
          { label: "Komandos", value: "3", icon: Users, color: "text-secondary" },
          { label: "Atsakymai", value: "18", icon: BarChart3, color: "text-highlight" },
        ].map((kpi) => {
          const KIcon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-lg border border-border/20 p-2 text-center"
            >
              <KIcon className={`h-3 w-3 ${kpi.color} mx-auto mb-0.5`} />
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
      <div className="space-y-1.5">
        {[
          { name: "Saulės komanda", pct: 85, color: "bg-primary" },
          { name: "Vėjo komanda", pct: 60, color: "bg-secondary" },
          { name: "Jūros komanda", pct: 45, color: "bg-highlight" },
        ].map((team) => (
          <div key={team.name} className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-16 truncate">
              {team.name}
            </span>
            <div className="flex-1 h-1.5 bg-border/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${team.color}/40`}
                style={{ width: `${team.pct}%` }}
              />
            </div>
            <span className="text-[8px] text-muted-foreground tabular-nums">
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
    <div className="w-full bg-gradient-to-br from-muted to-white p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-secondary/10 flex items-center justify-center">
            <Puzzle className="h-3 w-3 text-secondary" />
          </div>
          <span className="text-[9px] font-semibold text-steam-dark">
            Mokinio vaizdas
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-highlight" />
          <span className="text-[9px] font-bold text-steam-dark">280 tšk</span>
        </div>
      </div>
      {[
        { name: "Jūros ekosistema", pts: 100, done: true },
        { name: "Klimato pokyčiai", pts: 150, done: true },
        { name: "Energijos šaltiniai", pts: 200, done: false },
      ].map((ch) => (
        <div
          key={ch.name}
          className="flex items-center gap-2 p-2 rounded-lg bg-white border border-border/20"
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${ch.done ? "bg-primary/10" : "bg-muted"}`}
          >
            {ch.done ? (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            ) : (
              <Puzzle className="h-2.5 w-2.5 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-[9px] font-medium text-steam-dark">
              {ch.name}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Trophy className="h-2.5 w-2.5 text-highlight/50" />
            <span className="text-[8px] text-muted-foreground">{ch.pts}</span>
          </div>
        </div>
      ))}
      <div className="flex gap-1.5">
        <div className="flex-1 h-7 rounded border border-border/30 bg-white flex items-center px-2">
          <span className="text-[9px] text-muted-foreground/40">
            Įveskite atsakymą...
          </span>
        </div>
        <div className="h-7 px-2.5 rounded bg-primary/10 flex items-center">
          <span className="text-[9px] font-semibold text-primary">
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
    <SectionWrapper background="white">
      <SectionHeader
        title="Kaip platforma naudojama pamokoje"
      />

      {/* Descriptive text */}
      <div className="max-w-3xl mx-auto mb-12">
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <p className="text-[15px] text-muted-foreground leading-relaxed text-center">
            Pamokos metu mokiniai įsitraukia ne tik atsakinėdami į klausimus,
            bet ir spręsdami užduotis, analizuodami situacijas, diskutuodami
            bei ieškodami sprendimų kartu.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed text-center">
            Platforma padeda pamoką paversti aktyvesne mokymosi veikla,
            kurioje svarbu ne tik teisingas atsakymas, bet ir mąstymo
            procesas, argumentavimas bei bendradarbiavimas.
          </p>
        </motion.div>
      </div>

      {/* Product mockups */}
      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Teacher view */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="mb-3 flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5 text-primary" />
            <span className="inline-block text-[11px] font-semibold text-primary bg-primary/8 px-2.5 py-1 rounded-full">
              Mokytojo aplinka
            </span>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-br from-primary/8 via-transparent to-secondary/8 rounded-2xl blur-xl opacity-60" />
            <div className="relative rounded-2xl border border-border/40 bg-white overflow-hidden shadow-lg shadow-steam-dark/5">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-accent/40" />
                  <div className="w-2 h-2 rounded-full bg-highlight/40" />
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-white rounded h-4 flex items-center justify-center text-[8px] text-muted-foreground/40 font-mono border border-border/30">
                    www.kusteam.app
                  </div>
                </div>
              </div>
              <TeacherViewMock />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Realiu laiku matote komandų progresą ir rezultatus
          </p>
        </motion.div>

        {/* Student view */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative"
        >
          <div className="mb-3 flex items-center gap-2">
            <Smartphone className="h-3.5 w-3.5 text-secondary" />
            <span className="inline-block text-[11px] font-semibold text-secondary bg-secondary/8 px-2.5 py-1 rounded-full">
              Mokinio vaizdas
            </span>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-br from-secondary/8 via-transparent to-highlight/8 rounded-2xl blur-xl opacity-60" />
            <div className="relative rounded-2xl border border-border/40 bg-white overflow-hidden shadow-lg shadow-steam-dark/5">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-accent/40" />
                  <div className="w-2 h-2 rounded-full bg-highlight/40" />
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-white rounded h-4 flex items-center justify-center text-[8px] text-muted-foreground/40 font-mono border border-border/30">
                    www.kusteam.app/play
                  </div>
                </div>
              </div>
              <StudentViewMock />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Mokiniai sprendžia užduotis ir stebi savo progresą
          </p>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
