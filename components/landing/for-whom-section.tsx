"use client"

import { SectionWrapper } from "./section-wrapper"
import Image from "next/image"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { Building2, Users, BookOpen } from "lucide-react"

const audiences = [
  {
    icon: Building2,
    title: "Partnerių mokykloms",
    text: "Naudojasi Klaipėdos universiteto STEAM centro partnerių mokyklų mokytojai.",
  },
  {
    icon: Users,
    title: "Aktyviems mokytojams",
    text: "Tinka tiems, kurie ieško aktyvesnių, įtraukesnių ir šiuolaikiškesnių darbo būdų pamokoje.",
  },
  {
    icon: BookOpen,
    title: "Įvairioms veikloms",
    text: "Veikia tiek atskirų dalykų pamokose, tiek integruotose STEAM veiklose, projektiniuose darbuose ar neformaliajame ugdyme.",
  },
]

export function ForWhomSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <div className="grid lg:grid-cols-[1fr_440px] gap-12 lg:gap-20 items-center">
        <div>
          <motion.span
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold text-secondary uppercase tracking-widest mb-3"
          >
            Kam skirta
          </motion.span>
          <motion.h2
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-[36px] font-bold text-steam-dark leading-tight tracking-tight mb-8"
          >
            Kam tai skirta
          </motion.h2>

          <div className="space-y-6">
            {audiences.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={index}
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-secondary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-steam-dark text-[15px] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative hidden lg:block"
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-secondary/8 to-primary/8 rounded-3xl blur-2xl opacity-60" />
          <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-steam-dark/8 border border-border/30 aspect-[3/4]">
            <Image
              src="/photos/activity-teachers.jpg"
              alt="Mokytojai dalyvauja STEAM centro veiklose"
              fill
              className="object-cover"
              sizes="440px"
            />
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
