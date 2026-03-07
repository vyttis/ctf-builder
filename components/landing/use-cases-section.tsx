"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { FlaskConical, MapPin, BookOpen, Trophy } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const useCases = [
  {
    icon: FlaskConical,
    title: "STEAM laboratorija",
    description:
      "Biologijos pamoka apie jūros ekosistemas — mokiniai tyrinėja duomenis ir ieško atsakymų komandomis.",
    tag: "45 min \u2022 4\u20136 komandos",
    accentColor: "border-l-secondary",
    iconColor: "bg-secondary/10 text-secondary",
  },
  {
    icon: MapPin,
    title: "Lauko veikla",
    description:
      "Ekskursija su QR kodais — kiekviena stotelė turi iššūkį, kurį reikia išspręsti vietoje.",
    tag: "60 min \u2022 Lauke",
    accentColor: "border-l-primary",
    iconColor: "bg-primary/10 text-primary",
  },
  {
    icon: BookOpen,
    title: "Namų darbai",
    description:
      "Savaitinis iššūkis — mokiniai sprendžia savo tempu, o mokytojas mato progresą.",
    tag: "Asinchroninis \u2022 Individualiai ar komandomis",
    accentColor: "border-l-highlight",
    iconColor: "bg-highlight/10 text-highlight",
  },
  {
    icon: Trophy,
    title: "Varžybos tarp klasių",
    description:
      "STEAM savaitės renginys — kelios klasės varžosi tame pačiame žaidime.",
    tag: "Renginys \u2022 Neribota komandų",
    accentColor: "border-l-accent",
    iconColor: "bg-accent/10 text-accent",
  },
]

export function UseCasesSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Kaip naudoja mokytojai"
        subtitle="Nuo laboratorinių užsiėmimų iki lauko tyrimų — formatas prisitaiko prie jūsų pamokos."
      />

      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {useCases.map((useCase, index) => {
          const Icon = useCase.icon
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`rounded-2xl border border-border/40 border-l-4 ${useCase.accentColor} bg-white p-6 cursor-default`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${useCase.iconColor} flex items-center justify-center mb-4`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-steam-dark text-[15px] mb-2">
                {useCase.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {useCase.description}
              </p>
              <span className="inline-block text-[11px] font-medium text-muted-foreground/60 bg-muted/50 px-2.5 py-1 rounded-full">
                {useCase.tag}
              </span>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
