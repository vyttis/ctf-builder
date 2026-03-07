"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Users, Puzzle, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const values = [
  {
    icon: Users,
    title: "Komandinis darbas",
    description:
      "Mokiniai dirba grupėse, sprendžia užduotis kartu ir mokosi iš vienas kito.",
    photo: "/photos/classroom-hands.jpg",
    photoAlt: "Mokiniai kelia rankas pamokoje",
  },
  {
    icon: Puzzle,
    title: "Struktūruoti iššūkiai",
    description:
      "Kiekviena užduotis turi aiškų tikslą, atsakymą ir taškus — ne atviras klausimas, o konkretus iššūkis.",
    photo: "/photos/classroom-board.jpg",
    photoAlt: "Mokinė sprendžia uždavinį prie lentos",
  },
  {
    icon: BarChart3,
    title: "Realaus laiko stebėjimas",
    description:
      "Matote kiekvienos komandos progresą, atsakymus ir rezultatus pamokos metu.",
    photo: "/photos/classroom-teacher.jpg",
    photoAlt: "Mokytoja padeda mokiniams klasėje",
  },
]

export function ValueSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Ne viktorina. Ne testas. Struktūruotas komandinis iššūkis."
        subtitle="CTF (Capture The Flag) formatas paverčia bet kurią pamoką aktyviu, komandiniu mokymosi procesu su aiškia struktūra."
      />

      <div className="grid sm:grid-cols-3 gap-6">
        {values.map((value, index) => {
          const Icon = value.icon
          return (
            <motion.div
              key={index}
              initial={
                prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.14, duration: 0.7 }}
              whileHover={
                prefersReduced
                  ? {}
                  : { y: -4, transition: { duration: 0.2 } }
              }
              className="rounded-2xl border border-border/40 bg-[#F8FAFB] overflow-hidden group cursor-default"
            >
              {/* Photo instead of mock */}
              <div className="aspect-[3/2] overflow-hidden border-b border-border/20 relative">
                <img
                  src={value.photo}
                  alt={value.photoAlt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-steam-dark text-[15px] mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
