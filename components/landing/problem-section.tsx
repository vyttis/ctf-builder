"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { BookOpen, EyeOff, UsersRound } from "lucide-react"
import { motion } from "framer-motion"

const problems = [
  {
    icon: BookOpen,
    title: "Pasyvus mokymasis",
    description:
      "Tradicinės pamokos dažnai remiasi vienakrypte informacijos perdavimu, nepaliekant vietos mokinių iniciatyvai.",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop",
  },
  {
    icon: EyeOff,
    title: "Ribotas mokinių įsitraukimas",
    description:
      "Kai trūksta interaktyvumo, mokinių dėmesys ir motyvacija greitai mažėja.",
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&h=400&fit=crop",
  },
  {
    icon: UsersRound,
    title: "Sunku sukurti komandines veiklas",
    description:
      "Parengti struktūruotą grupinį darbą reikalauja daug laiko ir kūrybinių resursų.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
  },
]

export function ProblemSection() {
  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Šiuolaikinei pamokai reikia daugiau nei pateikties"
        subtitle="Mokiniams reikia aktyvaus dalyvavimo, problemų sprendimo ir tikro įsitraukimo — ne tik klausymosi."
      />

      <div className="grid sm:grid-cols-3 gap-6">
        {problems.map((problem, index) => {
          const Icon = problem.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-border/40 bg-[#F8FAFB] overflow-hidden group cursor-default"
            >
              <div className="aspect-[3/2] overflow-hidden">
                <img
                  src={problem.image}
                  alt={problem.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-accent/80" />
                </div>
                <h3 className="font-semibold text-steam-dark text-[15px] mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
