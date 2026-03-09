"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { BookX, Lightbulb, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import Image from "next/image"

const problems = [
  {
    icon: BookX,
    title: "Pasyvus dalyvavimas",
    description:
      "Daugelis pamokų vis dar remiasi informacijos pateikimu ir individualiu atsakinėjimu. Mokiniai klauso, bet ne visada įsitraukia.",
    photo: "/photos/classroom-lecture.jpg",
    photoAlt: "Tradicinė paskaita auditorijoje",
  },
  {
    icon: Lightbulb,
    title: "Aktyvus mokymasis veikia",
    description:
      "Mokiniai geriausiai mokosi spręsdami problemas, dirbdami komandoje ir ieškodami atsakymų patys — ne tik klausydami.",
    photo: "/photos/classroom-hands.jpg",
    photoAlt: "Mokiniai aktyviai dalyvauja pamokoje",
  },
  {
    icon: Zap,
    title: "Paprasta pritaikyti",
    description:
      "Ši platforma sukurta tam, kad aktyvaus mokymosi metodus būtų lengva integruoti į kasdienines pamokas — be sudėtingo pasiruošimo.",
    photo: "/photos/classroom-board.jpg",
    photoAlt: "Mokinė sprendžia uždavinį prie lentos",
  },
]

export function ValueSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <SectionHeader
        title="Kodėl pamokoms reikia kitokių metodų"
        subtitle="Aktyvus mokymasis, problemų sprendimas ir bendradarbiavimas — tai metodai, kurie įtraukia mokinius ir padeda jiems mokytis giliau."
      />

      <div className="grid sm:grid-cols-3 gap-6">
        {problems.map((item, index) => {
          const Icon = item.icon
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
              className="rounded-2xl border border-border/40 bg-muted overflow-hidden group cursor-default"
            >
              <div className="relative aspect-[3/2] overflow-hidden border-b border-border/20">
                <Image src={item.photo} alt={item.photoAlt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-steam-dark text-[15px] mb-2">
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
    </SectionWrapper>
  )
}
