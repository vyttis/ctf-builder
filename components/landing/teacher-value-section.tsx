import { SectionWrapper } from "./section-wrapper"

const stats = [
  {
    metric: "Greičiau",
    label: "Pamokos paruošimas",
    detail: "Standartinė pamoka paruošiama per kelias minutes, ne kelias valandas. Dirbtinis intelektas padeda ten, kur užtrunka daugiausia laiko.",
  },
  {
    metric: "Be",
    label: "Dalyvių registracijos",
    detail: "Dalyviai prisijungia per QR kodą, be paskyrų, elektroninio pašto ar slaptažodžių. Tinka pradinukams, gimnazistams ir tarp jų.",
  },
  {
    metric: "100 %",
    label: "Vedėjo sprendimas",
    detail: "Dirbtinis intelektas teikia pasiūlymus, bet galutinį užduočių turinį visada peržiūri ir patvirtina vedėjas.",
  },
  {
    metric: "Reali",
    label: "Pamokos eiga",
    detail: "Komandų progresas ir dalyvių atsakymai matomi realiu laiku, todėl galima reaguoti dar pamokos metu.",
  },
] as const

export function TeacherValueSection() {
  return (
    <SectionWrapper background="muted">
      {/* Editorial header */}
      <div className="max-w-3xl mb-16 md:mb-20">
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex h-px w-10 bg-steam-dark/40" />
          <span className="text-xs uppercase tracking-[0.22em] text-steam-dark/60 font-semibold">
            §6 · Mokytojui
          </span>
        </div>
        <h2 className="text-display-sm md:text-display-md text-steam-dark leading-[0.98] tracking-tight">
          Keturi{" "}
          <span className="font-display italic text-steam-dark/70">aiškūs</span>{" "}
          principai.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed text-pretty">
          Kuo įrankis naudingas mokytojo darbe, trumpai ir aiškiai.
        </p>
      </div>

      {/* Stats grid — editorial numeric */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 lg:gap-x-8 max-w-6xl">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="relative pl-6 border-l-2 border-steam-dark/15"
          >
            <div className="numeral-display font-medium text-5xl lg:text-6xl text-steam-dark leading-none tabular-nums">
              {stat.metric}
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary-ink font-bold mt-3">
              {stat.label}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-xs text-pretty">
              {stat.detail}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
