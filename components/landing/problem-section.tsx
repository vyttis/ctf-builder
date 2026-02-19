import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { BookOpen, EyeOff, UsersRound } from "lucide-react"

const problems = [
  {
    icon: BookOpen,
    title: "Pasyvus mokymasis",
    description:
      "Tradicinės pamokos dažnai remiasi vienakrypte informacijos perdavimu, nepaliekant vietos mokinių iniciatyvai.",
  },
  {
    icon: EyeOff,
    title: "Ribotas mokinių įsitraukimas",
    description:
      "Kai trūksta interaktyvumo, mokinių dėmesys ir motyvacija greitai mažėja.",
  },
  {
    icon: UsersRound,
    title: "Sunku sukurti komandines veiklas",
    description:
      "Parengti struktūruotą grupinį darbą reikalauja daug laiko ir kūrybinių resursų.",
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
            <div
              key={index}
              className="rounded-2xl border border-border/40 bg-[#F8FAFB] p-6 md:p-7"
            >
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
          )
        })}
      </div>
    </SectionWrapper>
  )
}
