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
} from "lucide-react"

const teacherBenefits = [
  { icon: Clock, text: "Greitas pasirengimas pamokai" },
  { icon: LayoutList, text: "Aiški struktūra" },
  { icon: ClipboardCheck, text: "Įtraukus vertinimo būdas" },
  { icon: TrendingUp, text: "Matomas progresas" },
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
}: {
  title: string
  benefits: { icon: React.ComponentType<{ className?: string }>; text: string }[]
  accentColor: string
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-[#F8FAFB] p-6 md:p-8">
      <h3 className="font-semibold text-steam-dark text-base mb-6">
        {title}
      </h3>
      <div className="space-y-4">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon
          return (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg ${accentColor} flex items-center justify-center shrink-0`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm text-steam-dark font-medium">
                {benefit.text}
              </span>
            </div>
          )
        })}
      </div>
    </div>
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
        />
        <BenefitColumn
          title="Mokiniams"
          benefits={studentBenefits}
          accentColor="bg-secondary/8 text-secondary"
        />
      </div>
    </SectionWrapper>
  )
}
