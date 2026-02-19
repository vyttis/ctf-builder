import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { FlaskConical, Monitor, Cog, Palette, Calculator } from "lucide-react"

const disciplines = [
  {
    icon: FlaskConical,
    letter: "S",
    name: "Mokslai",
    description: "Duomenų analizė, eksperimentų interpretavimas",
    color: "text-secondary bg-secondary/8",
    letterColor: "text-secondary",
  },
  {
    icon: Monitor,
    letter: "T",
    name: "Technologijos",
    description: "Skaitmeninės užduotys, loginiai sprendimai",
    color: "text-primary bg-primary/8",
    letterColor: "text-primary",
  },
  {
    icon: Cog,
    letter: "E",
    name: "Inžinerija",
    description: "Problemų sprendimas realiomis sąlygomis",
    color: "text-steam-dark bg-steam-dark/8",
    letterColor: "text-steam-dark",
  },
  {
    icon: Palette,
    letter: "A",
    name: "Menas",
    description: "Vizualinės mįslės ir kūrybiniai iššūkiai",
    color: "text-accent bg-accent/8",
    letterColor: "text-accent",
  },
  {
    icon: Calculator,
    letter: "M",
    name: "Matematika",
    description: "Skaičiavimai, modeliavimas, logika",
    color: "text-highlight bg-highlight/8",
    letterColor: "text-highlight",
  },
]

export function SteamIntegrationSection() {
  return (
    <SectionWrapper background="muted">
      <SectionHeader
        title="Vienas formatas — penkios disciplinos"
        subtitle="CTF formatas lengvai pritaikomas integruotoms STEAM veikloms."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {disciplines.map((d, index) => {
          const Icon = d.icon
          return (
            <div
              key={index}
              className="rounded-2xl border border-border/40 bg-white p-5 text-center"
            >
              <div
                className={`w-10 h-10 rounded-xl ${d.color} flex items-center justify-center mx-auto mb-3`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className={`text-xs font-bold ${d.letterColor} mb-1`}>
                {d.letter}
              </div>
              <h3 className="font-semibold text-steam-dark text-sm mb-1">
                {d.name}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {d.description}
              </p>
            </div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
