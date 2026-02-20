import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "CTF Builder | STEAM LT Klaipėda",
  description:
    "Klaipėdos universiteto metodinio STEAM centro mokytojams skirta platforma interaktyvioms CTF veikloms kurti ir valdyti klasėje.",
  icons: {
    icon: "/icon.svg",
  },
  metadataBase: new URL("https://ctf-builder.vercel.app"),
  openGraph: {
    title: "CTF pamokoms STEAM bendruomenei",
    description:
      "Klaipėdos universiteto metodinio STEAM centro mokytojams skirta platforma interaktyvioms CTF veikloms kurti ir valdyti klasėje.",
    url: "https://ctf-builder.vercel.app",
    siteName: "STEAM LT Klaipėda",
    type: "website",
    locale: "lt_LT",
  },
  twitter: {
    card: "summary_large_image",
    title: "CTF pamokoms STEAM bendruomenei",
    description:
      "Klaipėdos universiteto metodinio STEAM centro mokytojams skirta platforma interaktyvioms CTF veikloms kurti ir valdyti klasėje.",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="lt" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
