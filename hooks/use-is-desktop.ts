"use client"

import { useEffect, useState } from "react"

/**
 * Tracks whether the viewport is at or above the given breakpoint
 * (Tailwind `lg` = 1024px by default).
 *
 * Defaults to `true` so server render and the first client paint agree (no
 * hydration mismatch) and the desktop layout isn't hidden on desktop before
 * the effect runs; it's corrected to the real value on mount. Use it to render
 * a component in exactly one place instead of mounting it twice (e.g. a desktop
 * panel + a mobile sheet) and hiding one with CSS.
 */
export function useIsDesktop(query = "(min-width: 1024px)"): boolean {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setIsDesktop(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [query])

  return isDesktop
}
