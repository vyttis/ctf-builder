"use client"

import { SectionWrapper } from "./section-wrapper"
import { Zap, Users, Search, Brain, Target } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import Image from "next/image"

const useCases = [
  {
    icon: Zap,
    title: "Greitam žinių patikrinimui",
    description:
      "Greitai patikrinti, ar mokiniai suprato naują temą — kelios minutės ir vaizdas aiškus.",
    color: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: Users,
    title: "Komandiniams iššūkiams",
    description:
      "Paskatinti bendradarbiavimą, diskusiją ir bendrą sprendimų paiešką tarp mokinių.",
    color: "text-secondary",
    bg: "bg-secondary/8",
  },
  {
    icon: Search,
    title: "Tyrimo veikloms",
    description:
      "Mokiniai analizuoja informaciją, lygina, ieško paaiškinimų ir pagrindžia savo atsakymus.",
    color: "text-highlight",
    bg: "bg-highlight/8",
  },
  {
    icon: Brain,
    title: "Loginėms užduotims",
    description:
      "Nuoseklus mąstymas, sprendimas žingsnis po žingsnio ir žinių taikymas praktikoje.",
    color: "text-accent",
    bg: "bg-accent/8",
  },
  {
    icon: Target,
    title: "Integruotoms STEAM pamokoms",
    description:
      "Viena veikla apjungia kelis dalykus, praktinį taikymą ir problemų sprendimą.",
    color: "text-steam-dark",
    bg: "bg-steam-dark/8",
  },
]

export function UseCasesSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <div className="grid lg:grid-cols-[420px_1fr] gap-12 lg:gap-16 items-center">
        {/* Left — photo */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative hidden lg:block"
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/8 to-highlight/8 rounded-3xl blur-2xl opacity-60" />
          <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-steam-dark/8 border border-border/30 aspect-[3/4]">
            <Image
              src="/photos/classroom-hands.jpg"
              alt="Mokiniai aktyviai dalyvauja pamokoje"
              fill
              className="object-cover"
              sizes="420px"
            />
          </div>
        </motion.div>

        {/* Right — use cases list */}
        <div>
          <motion.span
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3"
          >
            Panaudojimo atvejai
          </motion.span>
          <motion.h2
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-[36px] font-bold text-steam-dark leading-tight tracking-tight mb-8"
          >
            Tinka įvairioms veikloms
          </motion.h2>

          <div className="space-y-4">
            {useCases.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={index}
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="flex gap-4 p-4 rounded-xl border border-border/40 bg-[#F6F8FA] hover:bg-white hover:shadow-md transition-all cursor-default"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-steam-dark text-[15px] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
