"use client"

import { useEffect } from "react"

export const UNSAVED_MESSAGE = "Yra neišsaugotų pakeitimų. Išeiti ir juos prarasti?"

/**
 * While `active`, warns before the page is closed or reloaded (the browser's
 * own dialog) and before a link inside the app leads away, so unsaved work
 * (a task being edited, a generated plan) is not lost by a stray click.
 */
export function useLeaveWarning(active: boolean, message: string = UNSAVED_MESSAGE) {
  useEffect(() => {
    if (!active) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Older browsers show the dialog only with a return value.
      event.returnValue = ""
    }

    // App links navigate without unloading the page, so they are caught
    // before the router sees the click (capture phase on the document).
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target : null
      const link = target?.closest("a[href]") as HTMLAnchorElement | null
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      if (!window.confirm(message)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClick, true)
    }
  }, [active, message])
}

/** True when an open task editor has changes that are not saved. */
export function hasUnsavedTask(): boolean {
  return typeof document !== "undefined" && document.querySelector('[data-unsaved-task="true"]') !== null
}
