/**
 * Teacher route skeleton — matches the dashboard / list layout so the page
 * "settles" rather than flashing a spinner-then-content.
 */
export default function TeacherLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Two CTA cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-32 rounded-lg border border-border/40 bg-muted/40 animate-pulse"
          />
        ))}
      </div>

      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 rounded bg-muted animate-pulse" />
        <div className="h-9 w-32 rounded bg-muted animate-pulse" />
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-44 rounded-lg border border-border/40 bg-white animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
