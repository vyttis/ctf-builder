import type { Metadata } from "next"
import { JoinScreen } from "@/components/player/join-screen"

export const metadata: Metadata = {
  title: "Prisijungti prie veiklos",
  description: "Įveskite veiklos kodą arba nuskaitykite QR kodą.",
}

export default function JoinPage() {
  return <JoinScreen />
}
