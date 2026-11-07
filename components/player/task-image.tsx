"use client"

import { useState } from "react"
import Image from "next/image"
import { Maximize2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

/**
 * A task's picture, whole (no cropping: a chart or map keeps its edges),
 * with "Padidinti" to see it full screen on a phone.
 */
export function TaskImage({ src, title, className = "" }: { src: string; title: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const alt = `Užduoties „${title}“ paveikslėlis`
  return (
    <>
      <div className={`relative mb-4 overflow-hidden rounded-xl border border-border/40 bg-white ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Padidinti: ${alt}`}
        >
          <Image src={src} alt={alt} width={800} height={480} className="mx-auto max-h-72 w-full object-contain" unoptimized />
        </button>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-full bg-steam-dark/75 px-2 py-1 text-xs font-medium text-white"
        >
          <Maximize2 className="h-3 w-3" />
          Padidinti
        </span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(96vw,1200px)] p-2 sm:p-3">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={1200}
            className="mx-auto max-h-[85vh] w-auto max-w-full object-contain"
            unoptimized
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
