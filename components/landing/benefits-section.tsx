"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import {
  Clock,
  LayoutList,
  ClipboardCheck,
  TrendingUp,
  Users,
  Brain,
  Sparkles,
  Target,
  CheckCircle2,
  Settings,
  BarChart3,
  FileText,
  Puzzle,
  Flag,
  Trophy,
  Star,
} from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const teacherBenefits = [
  { icon: Clock, text: "Greitas pasirengimas pamokai" },
  { icon: LayoutList, text: "Aiški struktūra ir formatas" },
  { icon: ClipboardCheck, text: "Įtraukus vertinimo būdas" },
  { icon: TrendingUp, text: "Matomas progresas realiu laiku" },
]

const studentBenefits = [
  { icon: Users, text: "Komandinis darbas" },
  { icon: Brain, text: "Kritinis mąstymas" },
  { icon: Sparkles, text: "Aktyvus įsitraukimas" },
  { icon: Target, text: "Motyvacija per iššūkius" },
]

function TeacherDashboardMock() {
  return (
    <div className="w-full bg-gradient-to-br from-[#F8FAFB] to-white p-3 space-y-2.5">
      {/* Mini top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
            <Settings className="h-3 w-3 text-primary" />
          </div>
          <span className="text-[9px] font-semibold text-steam-dark">Mokytojo valdymo pultas</span>
        </div>
        <div className="flex gap-1">
          <div className="h-4 px-1.5 bg-primary/8 rounded flex items-center">
            <span className="text-[8px] text-primary font-medium">3 aktyvūs</span>
          </div>
        </div>
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Užduotys", value: "12", icon: FileText, color: "text-primary" },
          { label: "Komandos", value: "6", icon: Users, color: "text-secondary" },
          { label: "Atsakymai", value: "48", icon: BarChart3, color: "text-highlight" },
        ].map((kpi) => {
          const KIcon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-lg border border-border/20 p-2 text-center">
              <KIcon className={`h-3 w-3 ${kpi.color} mx-auto mb-0.5`} />
              <div className="text-sm font-bold text-steam-dark leading-none">{kpi.value}</div>
              <div className="text-[8px] text-muted-foreground/60 mt-0.5">{kpi.label}</div>
            </div>
          )
        })}
      </div>
      {/* Mini progress bars */}
      <div className="space-y-1.5">
        {[
          { name: "Alfa komanda", pct: 85, color: "bg-primary" },
          { name: "Beta komanda", pct: 60, color: "bg-secondary" },
          { name: "Gama komanda", pct: 45, color: "bg-highlight" },
        ].map((team) => (
          <div key={team.name} className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-16 truncate">{team.name}</span>
            <div className="flex-1 h-1.5 bg-border/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${team.color}/40`} style={{ width: `${team.pct}%` }} />
            </div>
            <span className="text-[8px] text-muted-foreground tabular-nums">{team.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentGameMock() {
  return (
    <div className="w-full bg-gradient-to-br from-[#F8FAFB] to-white p-3 space-y-2.5">
      {/* Mini game header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-secondary/10 flex items-center justify-center">
            <Puzzle className="h-3 w-3 text-secondary" />
          </div>
          <span className="text-[9px] font-semibold text-steam-dark">Žaidėjo vaizdas</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-highlight" />
          <span className="text-[9px] font-bold text-steam-dark">280 tšk</span>
        </div>
      </div>
      {/* Challenge cards */}
      {[
        { name: "Duomenų mįslė", pts: 100, done: true },
        { name: "Kodų šifravimas", pts: 150, done: true },
        { name: "Jūros ekspedicija", pts: 200, done: false },
      ].map((ch) => (
        <div key={ch.name} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-border/20">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ch.done ? "bg-primary/10" : "bg-muted"}`}>
            {ch.done ? (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            ) : (
              <Flag className="h-2.5 w-2.5 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-[9px] font-medium text-steam-dark">{ch.name}</div>
          </div>
          <div className="flex items-center gap-0.5">
            <Trophy className="h-2.5 w-2.5 text-highlight/50" />
            <span className="text-[8px] text-muted-foreground">{ch.pts}</span>
          </div>
        </div>
      ))}
      {/* Answer input mock */}
      <div className="flex gap-1.5">
        <div className="flex-1 h-7 rounded border border-border/30 bg-white flex items-center px-2">
          <span className="text-[9px] text-muted-foreground/40">Įveskite flag...</span>
        </div>
        <div className="h-7 px-2.5 rounded bg-primary/10 flex items-center">
          <span className="text-[9px] font-semibold text-primary">Tikrinti</span>
        </div>
      </div>
    </div>
  )
}

function BenefitColumn({
  title,
  benefits,
  accentColor,
  MockComponent,
  delay,
}: {
  title: string
  benefits: { icon: React.ComponentType<{ className?: string }>; text: string }[]
  accentColor: string
  MockComponent: React.ComponentType
  delay: number
}) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-2xl border border-border/40 bg-[#F8FAFB] overflow-hidden"
    >
      <div className="aspect-[2/1] overflow-hidden border-b border-border/20">
        <MockComponent />
      </div>
      <div className="p-6 md:p-7">
        <h3 className="font-semibold text-steam-dark text-base mb-5">
          {title}
        </h3>
        <div className="space-y-3.5">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle2
                className={`h-4.5 w-4.5 shrink-0 ${accentColor.includes("primary") ? "text-primary" : "text-secondary"}`}
              />
              <span className="text-sm text-steam-dark font-medium">
                {benefit.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function BenefitsSection() {
  return (
    <SectionWrapper background="white">
      <SectionHeader title="Vertė mokytojui ir mokiniams" />

      <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <BenefitColumn
          title="Mokytojui"
          benefits={teacherBenefits}
          accentColor="bg-primary/8 text-primary"
          MockComponent={TeacherDashboardMock}
          delay={0}
        />
        <BenefitColumn
          title="Mokiniams"
          benefits={studentBenefits}
          accentColor="bg-secondary/8 text-secondary"
          MockComponent={StudentGameMock}
          delay={0.15}
        />
      </div>
    </SectionWrapper>
  )
}
