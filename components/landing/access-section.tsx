"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Handshake, GraduationCap, KeyRound, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const steps = [
  {
    number: "01",
    icon: Handshake,
    title: "Bendradarbiavimas su STEAM centru",
    description:
      "Platforma skirta partnerių mokykloms, bendradarbiaujančioms su Klaipėdos universiteto STEAM metodiniu centru.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    number: "02",
    icon: GraduationCap,
    title: "Dalyvavimas mokymuose ir dirbtuvėse",
    description:
      "Prieš pradedant naudoti platformą, mokytojai supažindinami su jos taikymu praktiniuose mokymuose ir veiklose.",
    color: "bg-primary/10 text-primary",
  },
  {
    number: "03",
    icon: KeyRound,
    title: "Prieigos suteikimas",
    description:
      "Po mokymų partnerių mokyklų mokytojams suteikiama prieiga prie platformos naudojimo.",
    color: "bg-highlight/10 text-highlight",
  },
]

export function AccessSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted" id="access">
      <SectionHeader
        title="Kaip suteikiama prieiga prie platformos"
      />

      <div className="max-w-3xl mx-auto">
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                initial={
                  prefersReduced ? { opacity: 1 } : { opacity: 0, x: -20 }
                }
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="flex gap-5 items-start"
              >
                <div className="relative shrink-0">
                  <div
                    className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-steam-dark text-white text-[10px] font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-px h-6 bg-border/40" />
                  )}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-steam-dark text-[15px] mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-10 p-6 rounded-2xl bg-white border border-border/40"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Jeigu jūsų mokyklą domina bendradarbiavimas ar norite daugiau
            informacijos apie platformos taikymą, kviečiame susisiekti su
            Klaipėdos universiteto STEAM metodiniu centru.
          </p>
          <a href="mailto:steam@ku.lt" className="inline-block mt-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-secondary/30 text-secondary hover:bg-secondary/5"
            >
              <Mail className="h-3.5 w-3.5" />
              Susisiekti su STEAM centru
            </Button>
          </a>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
