"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import {
  Sparkles,
  CheckCircle2,
  FileText,
  Brain,
  Zap,
} from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { Badge } from "@/components/ui/badge"

function AiMockUI() {
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
      {/* Left — Input */}
      <div className="bg-white rounded-xl border border-border/50 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-highlight/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-highlight" />
          </div>
          <span className="text-xs font-semibold text-steam-dark">
            DI asistentas
          </span>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-[#F6F8FA] border border-border/30 p-3">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
              Tema
            </span>
            <p className="text-sm text-steam-dark font-medium mt-0.5">
              Lietuvos pilys ir jų istorija
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-[#F6F8FA] border border-border/30 p-3">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
                Klasė
              </span>
              <p className="text-sm text-steam-dark font-medium mt-0.5">7 kl.</p>
            </div>
            <div className="flex-1 rounded-lg bg-[#F6F8FA] border border-border/30 p-3">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
                Dalykas
              </span>
              <p className="text-sm text-steam-dark font-medium mt-0.5">
                Istorija
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-1.5 bg-primary text-white rounded-lg px-4 py-2 text-xs font-semibold">
              <Sparkles className="h-3 w-3" />
              Generuoti
            </div>
          </div>
        </div>
      </div>

      {/* Right — Generated result */}
      <div className="bg-white rounded-xl border border-border/50 p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-steam-dark">
            Sugeneruota per 45 sek.
          </span>
          <Badge
            variant="secondary"
            className="text-[9px] bg-primary/8 text-primary border-0"
          >
            5 užduotys
          </Badge>
        </div>
        <div className="text-sm font-bold text-steam-dark">
          Lietuvos pilių paslaptys
        </div>
        <div className="space-y-2">
          {[
            {
              title: "Trakų pilis",
              type: "Pasirinkimas",
              difficulty: "Lengva",
              diffColor: "bg-primary/10 text-primary",
            },
            {
              title: "Kauno pilies likimas",
              type: "Tekstas",
              difficulty: "Vidutinė",
              diffColor: "bg-highlight/10 text-highlight",
            },
            {
              title: "Gynybos strategijos",
              type: "Tekstas",
              difficulty: "Sunki",
              diffColor: "bg-accent/10 text-accent",
            },
            {
              title: "Pilių chronologija",
              type: "Pasirinkimas",
              difficulty: "Vidutinė",
              diffColor: "bg-highlight/10 text-highlight",
            },
          ].map((ch, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg bg-[#F6F8FA] border border-border/30 px-3 py-2"
            >
              <div className="w-5 h-5 rounded bg-secondary/10 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-secondary">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-steam-dark truncate block">
                  {ch.title}
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground/60 shrink-0">
                {ch.type}
              </span>
              <span
                className={`text-[9px] font-medium ${ch.diffColor} px-1.5 py-0.5 rounded shrink-0`}
              >
                {ch.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const stats = [
  {
    icon: Zap,
    text: "Žaidimai per ~2 min",
    color: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: FileText,
    text: "Pamokų planai per ~1 min",
    color: "text-secondary",
    bg: "bg-secondary/8",
  },
  {
    icon: Brain,
    text: "DI tikrina kokybę automatiškai",
    color: "text-highlight",
    bg: "bg-highlight/8",
  },
  {
    icon: CheckCircle2,
    text: "Mokytojas visada patvirtina",
    color: "text-accent",
    bg: "bg-accent/8",
  },
]

export function AiShowcaseSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Dirbtinis intelektas — jūsų asistentas"
        subtitle="Nurodykite temą, klasę ir dalyką — DI pasiūlys visą žaidimo struktūrą su užduotimis, atsakymais ir užuominomis. Jūs tik peržiūrite ir patvirtinate."
      />

      {/* Mock UI */}
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto mb-12"
      >
        {/* Browser chrome */}
        <div className="rounded-2xl border border-border/50 overflow-hidden shadow-lg bg-[#F6F8FA]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-white">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-[#F6F8FA] rounded-md px-4 py-1 text-[10px] text-muted-foreground/50 font-medium">
                app.kusteam.lt/games/new
              </div>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <AiMockUI />
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-wrap justify-center gap-4 md:gap-6"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}
              >
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {stat.text}
              </span>
            </div>
          )
        })}
      </motion.div>
    </SectionWrapper>
  )
}
