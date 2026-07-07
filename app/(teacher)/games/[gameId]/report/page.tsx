import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PrintReportButton } from "@/components/teacher/print-report-button"
import { computeDetailedStats } from "@/lib/game/detailed-stats"
import { GameStats } from "@/types/game"
import { ArrowLeft } from "lucide-react"

interface ReflectionRow {
  id: string
  team_name: string
  hardest_challenge_title: string | null
  improvement_text: string
  liked_text: string | null
}

// Print-friendly one-page game report for documentation (Ministry-facing).
// Static markup only — no client fetching or animation; use the browser's
// print-to-PDF ("Spausdinti / Išsaugoti PDF").
export default async function GameReportPage({
  params,
}: {
  params: { gameId: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: game } = await supabase
    .from("games")
    .select("id, title, description, status, game_code, created_at, teacher_id")
    .eq("id", params.gameId)
    .eq("teacher_id", user!.id)
    .single()

  if (!game) {
    notFound()
  }

  const [{ data: profile }, { data: statsData }, detailed, { data: reflectionsData }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, school").eq("id", user!.id).single(),
      supabase.rpc("get_game_stats", { game_uuid: params.gameId }),
      computeDetailedStats(supabase, params.gameId),
      supabase.rpc("get_game_reflections", { game_uuid: params.gameId }),
    ])

  const stats = statsData as GameStats | null
  const reflections = ((reflectionsData as ReflectionRow[]) || []).slice(0, 5)
  const totalChallenges = detailed.challenge_stats.length

  const totalSolves = detailed.challenge_stats.reduce((s, c) => s + c.solves, 0)
  const completionPct =
    detailed.total_teams > 0 && totalChallenges > 0
      ? Math.round((totalSolves / (totalChallenges * detailed.total_teams)) * 100)
      : 0
  const accuracyPct =
    stats && stats.total_submissions > 0
      ? Math.round((stats.correct_submissions / stats.total_submissions) * 100)
      : 0

  const kpis = [
    { label: "Komandos", value: String(detailed.total_teams) },
    { label: "Užduotys", value: String(totalChallenges) },
    { label: "Užbaigimas", value: `${completionPct}%` },
    { label: "Bandymų tikslumas", value: `${accuracyPct}%` },
  ]

  return (
    <div className="max-w-3xl mx-auto bg-white print:max-w-none">
      {/* Screen-only toolbar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/games/${game.id}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Žaidimo detalės
          </Button>
        </Link>
        <PrintReportButton />
      </div>

      <div className="p-8 border border-border/50 rounded-lg print:border-0 print:p-0 space-y-6">
        {/* Report header */}
        <div className="border-b-2 border-steam-dark pb-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            CTF veiklos ataskaita
          </p>
          <h1 className="text-2xl font-bold text-steam-dark mt-1">{game.title}</h1>
          {game.description && (
            <p className="text-sm text-muted-foreground mt-1">{game.description}</p>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
            <span>
              <span className="text-muted-foreground">Mokytojas:</span>{" "}
              <span className="font-medium">{profile?.full_name || "—"}</span>
            </span>
            {profile?.school && (
              <span>
                <span className="text-muted-foreground">Mokykla:</span>{" "}
                <span className="font-medium">{profile.school}</span>
              </span>
            )}
            <span>
              <span className="text-muted-foreground">Data:</span>{" "}
              <span className="font-medium">
                {new Date(game.created_at).toLocaleDateString("lt-LT")}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Žaidimo kodas:</span>{" "}
              <span className="font-mono font-medium">{game.game_code}</span>
            </span>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="border border-border/50 rounded-lg p-3 text-center"
            >
              <p className="text-2xl font-bold text-steam-dark">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Team results */}
        <section style={{ breakInside: "avoid" }}>
          <h2 className="text-base font-semibold text-steam-dark mb-2">
            Komandų rezultatai
          </h2>
          {detailed.team_stats.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">#</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">Komanda</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground text-right">Taškai</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground text-right">Išspręsta</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground text-right">Bandymai</th>
                  <th className="py-1.5 font-medium text-muted-foreground text-right">Užuominos</th>
                </tr>
              </thead>
              <tbody>
                {detailed.team_stats.map((t, i) => (
                  <tr key={t.team_id} className="border-b border-border/40">
                    <td className="py-1.5 pr-2">{i + 1}</td>
                    <td className="py-1.5 pr-2 font-medium">{t.name}</td>
                    <td className="py-1.5 pr-2 text-right font-semibold">{t.total_points}</td>
                    <td className="py-1.5 pr-2 text-right">
                      {t.solved} / {totalChallenges}
                    </td>
                    <td className="py-1.5 pr-2 text-right">{t.attempts}</td>
                    <td className="py-1.5 text-right">{t.hints_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Žaidime nedalyvavo nė viena komanda.
            </p>
          )}
        </section>

        {/* Challenge stats */}
        <section style={{ breakInside: "avoid" }}>
          <h2 className="text-base font-semibold text-steam-dark mb-2">
            Užduočių statistika
          </h2>
          {detailed.challenge_stats.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">#</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">Užduotis</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground text-right">Taškai</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground text-right">Bandymai</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground text-right">Išsprendė</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground text-right">Tikslumas</th>
                  <th className="py-1.5 font-medium text-muted-foreground text-right">Užbaigimas</th>
                </tr>
              </thead>
              <tbody>
                {detailed.challenge_stats.map((c, i) => (
                  <tr key={c.challenge_id} className="border-b border-border/40">
                    <td className="py-1.5 pr-2">{i + 1}</td>
                    <td className="py-1.5 pr-2 font-medium">{c.title}</td>
                    <td className="py-1.5 pr-2 text-right">{c.points}</td>
                    <td className="py-1.5 pr-2 text-right">{c.total_attempts}</td>
                    <td className="py-1.5 pr-2 text-right">{c.solves}</td>
                    <td className="py-1.5 pr-2 text-right">{c.accuracy}%</td>
                    <td className="py-1.5 text-right">{c.completion_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">Užduočių nėra.</p>
          )}
        </section>

        {/* Reflections excerpt */}
        {reflections.length > 0 && (
          <section style={{ breakInside: "avoid" }}>
            <h2 className="text-base font-semibold text-steam-dark mb-2">
              Mokinių refleksijos (ištrauka)
            </h2>
            <div className="space-y-2">
              {reflections.map((r) => (
                <div
                  key={r.id}
                  className="border border-border/50 rounded-lg p-3 text-sm"
                >
                  <p className="font-medium text-steam-dark">{r.team_name}</p>
                  {r.hardest_challenge_title && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sudėtingiausia užduotis: {r.hardest_challenge_title}
                    </p>
                  )}
                  <p className="mt-1">
                    <span className="text-muted-foreground">Ką darytų kitaip:</span>{" "}
                    {r.improvement_text}
                  </p>
                  {r.liked_text && (
                    <p className="mt-0.5">
                      <span className="text-muted-foreground">Kas patiko:</span>{" "}
                      {r.liked_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Methodological note */}
        <section
          className="border border-border/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed"
          style={{ breakInside: "avoid" }}
        >
          <strong className="text-steam-dark">Metodinė pastaba.</strong>{" "}
          Ataskaita pateikia kiekybinius rodiklius. Pedagoginis vertinimas
          reikalauja kokybinės refleksijos su klase — kas pavyko, kodėl, ką
          darysite kitą pamoką.
        </section>

        {/* Signature footer */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-sm" style={{ breakInside: "avoid" }}>
          <div>
            <div className="border-b border-steam-dark h-8" />
            <p className="text-xs text-muted-foreground mt-1">Data</p>
          </div>
          <div>
            <div className="border-b border-steam-dark h-8" />
            <p className="text-xs text-muted-foreground mt-1">Parašas</p>
          </div>
        </div>
      </div>
    </div>
  )
}
