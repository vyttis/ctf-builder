"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import {
  Sparkles,
  Radio,
  Library,
  Bot,
  FileText,
  ShieldCheck,
  Pause,
  Megaphone,
  BarChart3,
  Trophy,
  QrCode,
  BookCopy,
  Filter,
  Copy,
  ArrowRightLeft,
} from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const pillars = [
  {
    icon: Sparkles,
    title: "Kurk su DI pagalba",
    description:
      "Dirbtinis intelektas pasiūlo turinį — jūs peržiūrite, redaguojate ir patvirtinate.",
    color: "bg-primary/10 text-primary",
    border: "border-primary/30",
    badgeColor: "bg-primary/8 text-primary",
    features: [
      { icon: Bot, text: "DI generuoja visą žaidimą pagal temą ir klasę" },
      { icon: Sparkles, text: "DI siūlo atskiras užduotis su atsakymais ir užuominomis" },
      { icon: FileText, text: "DI kuria pamokų planus su etapais ir refleksija" },
      { icon: ShieldCheck, text: "DI tikrina užduočių kokybę ir tikslumą" },
    ],
  },
  {
    icon: Radio,
    title: "Vesk pamoką realiu laiku",
    description:
      "Valdykite veiklą pamokos metu — stebėkite progresą, siųskite pranešimus ir reaguokite iš karto.",
    color: "bg-secondary/10 text-secondary",
    border: "border-secondary/30",
    badgeColor: "bg-secondary/8 text-secondary",
    features: [
      { icon: Pause, text: "Valdymo centras su pauzės ir tęsimo funkcija" },
      { icon: Megaphone, text: "Pranešimai visoms komandoms žaidimo metu" },
      { icon: BarChart3, text: "Komandų progresas ir atsakymai matomi realiu laiku" },
      { icon: Trophy, text: "Pasiekimų ženkliukai skatina mokinius" },
      { icon: QrCode, text: "QR kodas greitam prisijungimui per telefoną" },
    ],
  },
  {
    icon: Library,
    title: "Dalinkis ir naudok pakartotinai",
    description:
      "Kurkite vieną kartą — naudokite daugelį. Dalinkitės turiniu su kolegomis ir taupykite laiką.",
    color: "bg-highlight/10 text-highlight",
    border: "border-highlight/30",
    badgeColor: "bg-highlight/8 text-highlight",
    features: [
      { icon: BookCopy, text: "Žaidimų biblioteka su patvirtintais šablonais" },
      { icon: Filter, text: "Filtravimas pagal dalyką, klasę ir temą" },
      { icon: Copy, text: "Klonuokite ir pritaikykite kitų mokytojų žaidimus" },
      { icon: ArrowRightLeft, text: "Pamokos planą paverskite žaidimu vienu paspaudimu" },
    ],
  },
]

export function WhatYouCanDoSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Ką galima daryti su platforma"
        subtitle="Trys pagrindinės kryptys: kurti turinį su DI pagalba, vesti pamokas realiu laiku ir dalintis sukurtais žaidimais."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {pillars.map((pillar, index) => {
          const PillarIcon = pillar.icon
          return (
            <motion.div
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              className={`rounded-2xl border ${pillar.border} bg-white p-6 md:p-8 transition-all hover:shadow-lg hover:-translate-y-0.5`}
            >
              {/* Header */}
              <div
                className={`w-12 h-12 rounded-xl ${pillar.color} flex items-center justify-center mb-5`}
              >
                <PillarIcon className="h-6 w-6" />
              </div>

              <h3 className="font-bold text-steam-dark text-lg mb-2">
                {pillar.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {pillar.description}
              </p>

              {/* Feature list */}
              <ul className="space-y-3">
                {pillar.features.map((feature, fi) => {
                  const FeatureIcon = feature.icon
                  return (
                    <li key={fi} className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg ${pillar.badgeColor} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <FeatureIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        {feature.text}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
