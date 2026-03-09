"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import Image from "next/image"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

export function ForWhomSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <div className="grid md:grid-cols-[1fr_380px] gap-12 md:gap-16 items-center">
        <div>
          <SectionHeader
            title="Kam skirta ši platforma"
            align="left"
            className="mb-6"
          />

          <div className="space-y-3">
            <motion.p
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-[15px] text-muted-foreground leading-normal"
            >
              Platforma skirta Klaipėdos universiteto STEAM metodinio centro
              partnerių mokykloms ir mokytojams, kurie dalyvauja STEAM centro
              organizuojamose veiklose, mokymuose ir praktinėse dirbtuvėse.
            </motion.p>

            <motion.p
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-[15px] text-muted-foreground leading-normal"
            >
              Ji sukurta mokytojams, norintiems pamokose taikyti aktyvesnius,
              įtraukesnius ir šiuolaikiškus darbo metodus, kurie skatina mokinių
              smalsumą, bendradarbiavimą ir problemų sprendimą.
            </motion.p>

            <motion.p
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-[15px] text-muted-foreground leading-normal"
            >
              Platforma gali būti naudojama tiek atskirų dalykų pamokose, tiek
              integruotose STEAM veiklose, projektiniuose darbuose ar
              neformaliojo ugdymo užsiėmimuose.
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative hidden md:block"
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-secondary/8 to-primary/8 rounded-3xl blur-2xl opacity-60" />
          <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-steam-dark/8 border border-border/30 aspect-[4/5]">
            <Image
              src="/photos/activity-teachers.jpg"
              alt="Mokytojai dalyvauja STEAM centro veiklose"
              fill
              className="object-cover"
              sizes="380px"
            />
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
