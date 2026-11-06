import { SteamLogo } from "@/components/steam-logo"

interface RequestPageShellProps {
  title: string
  context?: string
  children: React.ReactNode
}

/** Frame for the request pages reached by QR or a request link. */
export function RequestPageShell({ title, context, children }: RequestPageShellProps) {
  return (
    <main className="min-h-screen bg-muted px-4 py-10">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <SteamLogo size="large" />
        </div>
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-steam-dark">{title}</h1>
            {context && <p className="text-sm text-muted-foreground">{context}</p>}
          </div>
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          KU STEAM centras, Klaipėdos universitetas. Klausimai: steam@ku.lt
        </p>
      </div>
    </main>
  )
}
