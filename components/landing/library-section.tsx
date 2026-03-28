"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import {
  Sparkles,
  Copy,
  ArrowRight,
  FileText,
  GraduationCap,
  Puzzle,
} from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const subjects = [
  { label: "Matematika", active: false },
  { label: "Biologija", active: true },
  { label: "Geografija", active: false },
  { label: "Istorija", active: false },
  { label: "STEAM", active: false },
  { label: "Fizika", active: false },
]

const templates = [
  {
    title: "Augalų fotosintezė",
    subject: "Biologija",
    grade: "7 kl.",
    challenges: 6,
    ai: false,
  },
  {
    title: "Ekosistemų tyrimai",
    subject: "Biologija",
    grade: "8 kl.",
    challenges: 8,
    ai: true,
  },
  {
    title: "Ląstelės sandara",
    subject: "Biologija",
    grade: "7 kl.",
    challenges: 5,
    ai: false,
  },
]

function LibraryMockUI() {
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <div
            key={s.label}
            className={`px-3 py-1.5 rounded-full text-[10px] font-medium border transition-colors ${
              s.active
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-white text-muted-foreground border-border/30 hover:border-border/50"
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Template cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {templates.map((t, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/40 bg-white p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="text-xs font-bold text-steam-dark leading-tight">
                {t.title}
              </div>
              {t.ai && (
                <div className="flex items-center gap-0.5 bg-highlight/8 text-highlight rounded px-1.5 py-0.5 shrink-0 ml-2">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span className="text-[8px] font-medium">DI</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-[9px] bg-secondary/8 text-secondary rounded px-1.5 py-0.5">
                <FileText className="h-2.5 w-2.5" />
                {t.subject}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                <GraduationCap className="h-2.5 w-2.5" />
                {t.grade}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                <Puzzle className="h-2.5 w-2.5" />
                {t.challenges} užd.
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-primary cursor-default">
              <Copy className="h-3 w-3" />
              Klonuoti
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LibrarySection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Biblioteka — dalinkitės ir naudokite pakartotinai"
        subtitle="Suraskite kitų mokytojų sukurtus žaidimus pagal dalyką ir klasę arba pasidalinkite savais su bendruomene."
      />

      {/* Mock UI in browser chrome */}
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="rounded-2xl border border-border/50 overflow-hidden shadow-lg bg-[#F6F8FA]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-white">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-[#F6F8FA] rounded-md px-4 py-1 text-[10px] text-muted-foreground/50 font-medium">
                app.kusteam.lt/library
              </div>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <LibraryMockUI />
          </div>
        </div>
      </motion.div>

      {/* Conversion callout */}
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex justify-center"
      >
        <div className="inline-flex items-center gap-2.5 bg-[#F6F8FA] border border-border/40 rounded-xl px-5 py-3">
          <div className="w-8 h-8 rounded-lg bg-secondary/8 flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-secondary" />
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            Arba konvertuokite pamokų planą į žaidimą vienu paspaudimu
          </span>
        </div>
      </motion.div>
    </SectionWrapper>
  )
}
