import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Compass } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Compass className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-steam-dark mb-2">
          Puslapis nerastas
        </h1>
        <p className="text-muted-foreground mb-6">
          Ieškomas puslapis neegzistuoja arba buvo perkeltas.
        </p>
        <Link href="/">
          <Button>Į pradžią</Button>
        </Link>
      </div>
    </div>
  )
}
