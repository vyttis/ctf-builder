import type { Metadata } from "next"
import { JoinScreen } from "@/components/player/join-screen"

export const metadata: Metadata = {
  title: "Prisijungti prie veiklos | KU STEAM pamokos",
  description: "Įveskite veiklos kodą arba nuskaitykite QR kodą.",
}

export default function JoinPage() {
  return <JoinScreen />
}
