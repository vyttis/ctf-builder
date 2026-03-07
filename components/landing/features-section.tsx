"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Sparkles, Users, Trophy, FileText, Lightbulb, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const features = [
  {
    icon: Sparkles,
    title: "DI užduočių generavimas",
    description:
      "Aprašykite temą — DI sugeneruos užduotis su atsakymais, užuominomis ir paaiškinimais.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Users,
    title: "Komandinis žaidimas",
    description:
      "Mokiniai jungiasi komandomis per QR kodą — be registracijos, be slaptažodžių.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Trophy,
    title: "Realaus laiko lyderių lentelė",
    description:
      "Komandos mato savo vietą, taškus ir progresą — motyvacija per sveiką konkurenciją.",
    color: "bg-highlight/10 text-highlight",
  },
  {
    icon: FileText,
    title: "Importas iš dokumento",
    description:
      "Įkelkite PDF, DOCX ar TXT failą — DI sugeneruos užduotis pagal jūsų mokomąją medžiagą.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Lightbulb,
    title: "Progresinės užuominos",
    description:
      "Užuominos atskleidžiamos po vieną — kiekviena sumažina taškus, bet padeda mokytis.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BarChart3,
    title: "Mokytojo analitika",
    description:
      "Matykite kiekvienos užduoties tikslumą, komandų progresą ir sunkumo lygį.",
    color: "bg-secondary/10 text-secondary",
  },
]

export function FeaturesSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Viskas, ko reikia interaktyviai pamokai"
        subtitle="Nuo iššūkių kūrimo iki rezultatų analizės — viename įrankyje."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={
                prefersReduced
                  ? {}
                  : { y: -4, transition: { duration: 0.2 } }
              }
              className="rounded-2xl border border-border/40 bg-[#F8FAFB] p-6 cursor-default transition-shadow hover:shadow-md"
            >
              <div
                className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center mb-4`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-steam-dark text-[15px] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
