import { SectionWrapper } from "./section-wrapper"
import {
  Settings,
  Users,
  BarChart3,
  Puzzle,
  Star,
  CheckCircle2,
  Trophy,
  Smartphone,
  Monitor,
} from "lucide-react"

function TeacherViewMock() {
  return (
    <div className="w-full bg-gradient-to-br from-[#F6F8FA] to-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
            <Settings className="h-3 w-3 text-primary-ink" />
          </div>
          <span className="text-[10px] font-semibold text-steam-dark">
            Vedėjo aplinka
          </span>
        </div>
        <div className="flex gap-1">
          <div className="h-5 px-2 bg-primary/8 rounded flex items-center">
            <span className="text-[9px] text-primary-ink font-medium">
              3 komandos
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Užduotys", value: "8", icon: Puzzle, color: "text-primary-ink" },
          { label: "Komandos", value: "3", icon: Users, color: "text-secondary-ink" },
          { label: "Atsakymai", value: "18", icon: BarChart3, color: "text-highlight-ink" },
        ].map((kpi) => {
          const KIcon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-lg border border-border/30 p-2.5 text-center shadow-sm"
            >
              <KIcon className={`h-3.5 w-3.5 ${kpi.color} mx-auto mb-1`} />
              <div className="text-sm font-bold text-steam-dark leading-none">
                {kpi.value}
              </div>
              <div className="text-[8px] text-muted-foreground/60 mt-0.5">
                {kpi.label}
              </div>
            </div>
          )
        })}
      </div>
      <div className="space-y-2">
        {[
          { name: "Saulės komanda", pct: 85, barColor: "bg-primary" },
          { name: "Vėjo komanda", pct: 60, barColor: "bg-secondary" },
          { name: "Jūros komanda", pct: 45, barColor: "bg-highlight" },
        ].map((team) => (
          <div key={team.name} className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-20 truncate font-medium">
              {team.name}
            </span>
            <div className="flex-1 h-2 bg-border/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${team.barColor} opacity-50`}
                style={{ width: `${team.pct}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground tabular-nums font-medium">
              {team.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentViewMock() {
  return (
    <div className="w-full bg-gradient-to-br from-[#F6F8FA] to-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-secondary/10 flex items-center justify-center">
            <Puzzle className="h-3 w-3 text-secondary-ink" />
          </div>
          <span className="text-[10px] font-semibold text-steam-dark">
            Dalyvio vaizdas
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-highlight-ink" />
          <span className="text-[10px] font-bold text-steam-dark">280 tšk</span>
        </div>
      </div>
      {[
        { name: "Jūros ekosistema", pts: 100, done: true },
        { name: "Klimato pokyčiai", pts: 150, done: true },
        { name: "Energijos šaltiniai", pts: 200, done: false },
      ].map((ch) => (
        <div
          key={ch.name}
          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-border/30 shadow-sm"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${ch.done ? "bg-primary/10" : "bg-muted"}`}
          >
            {ch.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-primary-ink" />
            ) : (
              <Puzzle className="h-3 w-3 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-medium text-steam-dark">
              {ch.name}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Trophy className="h-3 w-3 text-highlight-ink/50" />
            <span className="text-[9px] text-muted-foreground">{ch.pts}</span>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <div className="flex-1 h-8 rounded-lg border border-border/30 bg-white flex items-center px-2.5 shadow-sm">
          <span className="text-[10px] text-muted-foreground/40">
            Įveskite atsakymą...
          </span>
        </div>
        <div className="h-8 px-3 rounded-lg bg-primary/10 flex items-center">
          <span className="text-[10px] font-semibold text-primary-ink">
            Tikrinti
          </span>
        </div>
      </div>
    </div>
  )
}

export function ClassroomExperienceSection() {
  return (
    <SectionWrapper background="paper">
      {/* Editorial header */}
      <div className="max-w-3xl mb-16 md:mb-20 text-center mx-auto">
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="inline-flex h-px w-10 bg-steam-dark/40" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-steam-dark/60 font-semibold">
            §4 · Pamokoje
          </span>
          <span className="inline-flex h-px w-10 bg-steam-dark/40" />
        </div>
        <h2 className="text-display-sm md:text-display-md text-steam-dark leading-[0.98] tracking-tight">
          Dvi pusės{" "}
          <span className="font-display italic text-steam-dark/70">tos pačios</span>{" "}
          pamokos.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed text-pretty">
          Vedėjas mato visų komandų progresą vienu žvilgsniu. Dalyvis mato savo
          užduotis, komandos rezultatus ir asmeninį progresą.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Facilitator view */}
        <div
        >
          <div className="mb-4 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary-ink" />
            <span className="text-sm font-semibold text-steam-dark">
              Vedėjo aplinka
            </span>
          </div>
          <div className="relative group">
            <div className="absolute -inset-3 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative rounded-xl border border-border/50 bg-white overflow-hidden shadow-lg shadow-steam-dark/5 transition-shadow group-hover:shadow-xl">
              <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/30 bg-[#F6F8FA]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-highlight/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md h-5 flex items-center justify-center text-[9px] text-muted-foreground/40 font-mono border border-border/30">
                    pamokos.kusteam.app/vedejui
                  </div>
                </div>
              </div>
              <TeacherViewMock />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center font-medium">
            Realiu laiku matote komandų progresą ir rezultatus
          </p>
        </div>

        {/* Participant view */}
        <div
        >
          <div className="mb-4 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-secondary-ink" />
            <span className="text-sm font-semibold text-steam-dark">
              Dalyvio vaizdas
            </span>
          </div>
          <div className="relative group">
            <div className="absolute -inset-3 bg-gradient-to-br from-secondary/10 via-transparent to-highlight/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative rounded-xl border border-border/50 bg-white overflow-hidden shadow-lg shadow-steam-dark/5 transition-shadow group-hover:shadow-xl">
              <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/30 bg-[#F6F8FA]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-highlight/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md h-5 flex items-center justify-center text-[9px] text-muted-foreground/40 font-mono border border-border/30">
                    pamokos.kusteam.app/prisijungti
                  </div>
                </div>
              </div>
              <StudentViewMock />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center font-medium">
            Dalyviai sprendžia užduotis ir stebi savo progresą
          </p>
        </div>
      </div>
    </SectionWrapper>
  )
}
