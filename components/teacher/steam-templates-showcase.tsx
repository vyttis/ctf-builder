import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"
import { LESSON_TEMPLATES } from "@/lib/curriculum/lesson-templates"
import { getSubjectLabel } from "@/lib/curriculum/subjects"

export function SteamTemplatesShowcase() {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-background to-secondary/5 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
              <Sparkles className="h-3 w-3" />
              NAUJIENA
            </span>
            <span className="text-xs text-muted-foreground">Integruotos STEAM pamokos</span>
          </div>
          <h2 className="text-lg font-bold text-steam-dark">
            Pradėkite nuo paruošto pavyzdžio
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pasirinkite dviejų dalykų derinį — DI sukurs pamokos planą, kuriame veiklos organiškai jungia abu dalykus.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LESSON_TEMPLATES.map((t) => (
          <Link
            key={t.id}
            href={`/lesson-plans/new?template=${t.id}`}
            className="group rounded-xl border border-border/50 bg-white p-4 transition-all hover:border-accent/40 hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{t.emoji}</span>
              <span className="text-sm font-semibold text-steam-dark">{t.title}</span>
            </div>
            <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 font-medium text-secondary">
                {getSubjectLabel(t.subject)}
              </span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
                + {getSubjectLabel(t.secondary_subject)}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                {t.grade} kl.
              </span>
            </div>
            <div className="mt-3 flex items-center text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
              Atidaryti formą
              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
