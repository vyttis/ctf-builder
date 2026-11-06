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

    // Back and Forward inside the app change the route without unloading.
    // A guard entry with the same address takes the first Back; the
    // question then decides whether to go on or to stay.
    const pushGuard = () => {
      const state = window.history.state as Record<string, unknown> | null
      if (state?.__leaveGuard) return
      window.history.pushState({ ...(state ?? {}), __leaveGuard: true }, "", window.location.href)
    }
    const onPopState = () => {
      if (window.confirm(message)) {
        window.removeEventListener("popstate", onPopState)
        window.history.back()
      } else {
        pushGuard()
      }
    }
    pushGuard()

    window.addEventListener("beforeunload", onBeforeUnload)
    window.addEventListener("popstate", onPopState)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      window.removeEventListener("popstate", onPopState)
      document.removeEventListener("click", onClick, true)
    }
  }, [active, message])
}

/** True when an open task editor has changes that are not saved. */
export function hasUnsavedTask(): boolean {
  return typeof document !== "undefined" && document.querySelector('[data-unsaved-task="true"]') !== null
}

/** A dismiss (Atšaukti, closing a sheet) of a task with unsaved changes asks first. */
export function confirmDiscardTask(): boolean {
  return !hasUnsavedTask() || window.confirm("Užduoties pakeitimai neišsaugoti. Atmesti juos?")
}

/**
 * Work kept in this browser (generated plan drafts, DI suggestions) belongs
 * to the signed-in facilitator: signing out removes it, so the next person
 * on a shared computer does not get it.
 */
export function clearLocalWork() {
  for (const store of [() => window.localStorage, () => window.sessionStorage]) {
    try {
      const storage = store()
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i)
        if (key && (key.startsWith("ks-lesson-plan-draft") || key.startsWith("ks-di-suggestions"))) {
          storage.removeItem(key)
        }
      }
    } catch {
      // Storage blocked: nothing was kept.
    }
  }
}
