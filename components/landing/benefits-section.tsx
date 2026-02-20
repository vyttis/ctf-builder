"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import {
  Clock,
  LayoutList,
  ClipboardCheck,
  TrendingUp,
  Users,
  Brain,
  Sparkles,
  Target,
  CheckCircle2,
} from "lucide-react"
import { motion } from "framer-motion"

const teacherBenefits = [
  { icon: Clock, text: "Greitas pasirengimas pamokai" },
  { icon: LayoutList, text: "Aiški struktūra ir formatas" },
  { icon: ClipboardCheck, text: "Įtraukus vertinimo būdas" },
  { icon: TrendingUp, text: "Matomas progresas realiu laiku" },
]

const studentBenefits = [
  { icon: Users, text: "Komandinis darbas" },
  { icon: Brain, text: "Kritinis mąstymas" },
  { icon: Sparkles, text: "Aktyvus įsitraukimas" },
  { icon: Target, text: "Motyvacija per iššūkius" },
]

function BenefitColumn({
  title,
  benefits,
  accentColor,
  image,
  delay,
}: {
  title: string
  benefits: { icon: React.ComponentType<{ className?: string }>; text: string }[]
  accentColor: string
  image: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-2xl border border-border/40 bg-[#F8FAFB] overflow-hidden"
    >
      <div className="aspect-[2/1] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6 md:p-7">
        <h3 className="font-semibold text-steam-dark text-base mb-5">
          {title}
        </h3>
        <div className="space-y-3.5">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle2
                className={`h-4.5 w-4.5 shrink-0 ${accentColor.includes("primary") ? "text-primary" : "text-secondary"}`}
              />
              <span className="text-sm text-steam-dark font-medium">
                {benefit.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function BenefitsSection() {
  return (
    <SectionWrapper background="white">
      <SectionHeader title="Vertė mokytojui ir mokiniams" />

      <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <BenefitColumn
          title="Mokytojui"
          benefits={teacherBenefits}
          accentColor="bg-primary/8 text-primary"
          image="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=300&fit=crop"
          delay={0}
        />
        <BenefitColumn
          title="Mokiniams"
          benefits={studentBenefits}
          accentColor="bg-secondary/8 text-secondary"
          image="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&h=300&fit=crop"
          delay={0.15}
        />
      </div>
    </SectionWrapper>
  )
}
