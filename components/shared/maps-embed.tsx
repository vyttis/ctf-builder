"use client"

import { MapPin, ExternalLink } from "lucide-react"

interface MapsEmbedProps {
  url: string
  className?: string
}

function extractMapsQuery(url: string): string | null {
  try {
    // Try coordinates: /@lat,lng
    const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (coordMatch) {
      return `${coordMatch[1]},${coordMatch[2]}`
    }

    // Try place name: /place/Name/
    const placeMatch = url.match(/\/place\/([^/@]+)/)
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, " "))
    }

    // Try query param: ?q=something
    const qMatch = url.match(/[?&]q=([^&]+)/)
    if (qMatch) {
      return decodeURIComponent(qMatch[1].replace(/\+/g, " "))
    }

    // Try search query in URL path
    const searchMatch = url.match(/\/maps\/search\/([^/]+)/)
    if (searchMatch) {
      return decodeURIComponent(searchMatch[1].replace(/\+/g, " "))
    }

    // Try short URL — just return as-is for embed
    if (url.includes("goo.gl") || url.includes("maps.app.goo.gl")) {
      return null
    }

    return null
  } catch {
    return null
  }
}

function isValidMapsUrl(url: string): boolean {
  return (
    url.includes("google.com/maps") ||
    url.includes("google.lt/maps") ||
    url.includes("maps.google") ||
    url.includes("goo.gl/maps") ||
    url.includes("maps.app.goo.gl")
  )
}

export function MapsEmbed({ url, className = "" }: MapsEmbedProps) {
  if (!url || !isValidMapsUrl(url)) {
    return null
  }

  const query = extractMapsQuery(url)

  if (!query) {
    // Fallback: show link with map icon
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors ${className}`}
      >
        <MapPin className="h-4 w-4" />
        Atidaryti žemėlapyje
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  return (
    <div className={`rounded-xl overflow-hidden border border-border/50 ${className}`}>
      <iframe
        src={embedUrl}
        width="100%"
        height="250"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Maps"
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-primary transition-colors bg-muted/30"
      >
        <MapPin className="h-3 w-3" />
        Atidaryti Google Maps
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}
