import { SectionWrapper } from "./section-wrapper"
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react"

export function InstitutionSection() {
  return (
    <SectionWrapper background="muted">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-steam-dark leading-tight">
          Klaipėdos universiteto STEAM atviros prieigos centras
        </h2>

        <p className="text-[15px] text-muted-foreground mt-4 leading-relaxed max-w-2xl mx-auto">
          Klaipėdos universiteto metodinis STEAM centras — Baltijos jūros
          regiono tvarios mėlynosios ekonomikos sektoriaus augimą
          populiarinantis centras, kviečiantis moksleivius inovatyviai
          susipažinti su mokslo pagrindais penkių laboratorijų erdvėse.
        </p>

        {/* Contact details */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Herkaus Manto g. 84, Klaipėda
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-primary" />
            +370 (46) 398 978
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-primary" />
            steam@ku.lt
          </span>
        </div>

        <a
          href="https://www.ku.lt/steam"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-4"
        >
          Sužinoti daugiau apie centrą
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </SectionWrapper>
  )
}
