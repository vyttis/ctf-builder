/**
 * Player route skeleton — mirrors the play page layout so students don't
 * see a jarring spinner-to-content flash on iOS Safari.
 */
export default function PlayLoading() {
  return (
    <div className="min-h-screen p-4 pb-8">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Top progress bar placeholder */}
        <div className="h-1.5 rounded-full bg-muted animate-pulse" />

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 rounded bg-muted animate-pulse" />
          <div className="h-6 w-20 rounded bg-muted animate-pulse" />
        </div>

        {/* Challenge card skeleton */}
        <div className="rounded-lg border border-border/40 bg-white p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-4 w-full rounded bg-muted/60 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted/60 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="h-12 w-full rounded bg-muted animate-pulse mt-4" />
          <div className="h-12 w-full rounded bg-primary/30 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
