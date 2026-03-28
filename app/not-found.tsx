import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">
          Puslapis nerastas
        </h2>
        <p className="text-muted-foreground max-w-md">
          Atsiprašome, bet puslapis, kurio ieškote, neegzistuoja arba buvo
          perkeltas.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Grįžti į pradžią
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
          >
            Valdymo skydelis
          </Link>
        </div>
      </div>
    </div>
  )
}
