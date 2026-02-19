import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Flag, Users, BarChart3, Puzzle } from "lucide-react"

const features = [
  {
    icon: Puzzle,
    text: "Užduotys pateikiamos kaip iššūkiai",
  },
  {
    icon: Flag,
    text: 'Atsakymas — „flag", kurį reikia surasti',
  },
  {
    icon: Users,
    text: "Galima dirbti komandomis",
  },
  {
    icon: BarChart3,
    text: "Rezultatai matomi realiu laiku",
  },
]

export function CtfExplanationSection() {
  return (
    <SectionWrapper background="muted">
      <div className="max-w-3xl mx-auto">
        <SectionHeader
          title="CTF — struktūruotas iššūkis mokymuisi"
          align="center"
        />

        <p className="text-[15px] text-muted-foreground leading-relaxed text-center -mt-8 mb-10 max-w-2xl mx-auto">
          CTF (Capture The Flag) — tai problemų sprendimo metodas, kai mokiniai
          sprendžia temines užduotis ir už teisingus atsakymus gauna taškus.
          Edukacijoje tai tampa aiškiai struktūruotu, komandiniu mokymosi
          formatu.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="flex items-start gap-3.5 rounded-xl border border-border/40 bg-white p-5"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-steam-dark leading-relaxed pt-1.5">
                  {feature.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </SectionWrapper>
  )
}
