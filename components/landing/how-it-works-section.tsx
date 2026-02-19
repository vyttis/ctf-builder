import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"

const steps = [
  {
    number: "01",
    title: "Sukuriate temą ir užduotis",
    description: "Pasirinkite pamokos temą ir sukurkite klausimus pagal savo dalyką.",
  },
  {
    number: "02",
    title: "Nustatote atsakymus ir taškų sistemą",
    description: "Kiekvienai užduočiai priskiriate teisingą atsakymą ir taškus.",
  },
  {
    number: "03",
    title: "Pasidalinate QR kodu su mokiniais",
    description: "Mokiniai nuskaito kodą telefonu ir iškart prisijungia prie žaidimo.",
  },
  {
    number: "04",
    title: "Stebite progresą realiu laiku",
    description: "Matote, kaip komandos sprendžia užduotis ir renkasi taškus.",
  },
]

export function HowItWorksSection() {
  return (
    <SectionWrapper background="white" id="how-it-works">
      <SectionHeader
        title="Keturi žingsniai iki interaktyvios pamokos"
        align="center"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            {/* Connector line for desktop */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-6 left-[calc(50%+32px)] w-[calc(100%-32px)] h-px bg-border/60" />
            )}

            <div className="text-center lg:text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto lg:mx-0 mb-4">
                <span className="text-lg font-extrabold text-primary">
                  {step.number}
                </span>
              </div>
              <h3 className="font-semibold text-steam-dark text-[15px] mb-1.5">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
