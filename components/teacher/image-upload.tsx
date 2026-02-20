"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ImagePlus, X, Upload, Loader2, Link as LinkIcon } from "lucide-react"

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Netinkamas failas",
          description: "Galima įkelti tik paveiksliukus (JPEG, PNG, GIF, WebP)",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Per didelis failas",
          description: "Maksimalus dydis — 5MB",
          variant: "destructive",
        })
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Nepavyko įkelti")
        }

        const { url } = await res.json()
        onChange(url)
        toast({ title: "Paveiksliukas įkeltas!" })
      } catch (error: unknown) {
        toast({
          title: "Klaida",
          description:
            error instanceof Error ? error.message : "Nepavyko įkelti",
          variant: "destructive",
        })
      } finally {
        setUploading(false)
      }
    },
    [onChange, toast]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) uploadFile(file)
    },
    [uploadFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) uploadFile(file)
    },
    [uploadFile]
  )

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    try {
      new URL(urlInput.trim())
      onChange(urlInput.trim())
      setShowUrlInput(false)
      setUrlInput("")
    } catch {
      toast({
        title: "Netinkamas URL",
        description: "Įveskite teisingą paveiksliuko nuorodą",
        variant: "destructive",
      })
    }
  }

  const handleRemove = () => {
    onChange(null)
  }

  // If image exists, show preview
  if (value) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <ImagePlus className="h-3.5 w-3.5 text-primary" />
          Paveiksliukas
        </Label>
        <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/20">
          <img
            src={value}
            alt="Užduoties paveiksliukas"
            className="w-full max-h-48 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full shadow-lg"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <ImagePlus className="h-3.5 w-3.5 text-primary" />
        Paveiksliukas (neprivaloma)
      </Label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all
          ${
            dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Įkeliama...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <span className="text-sm font-medium text-steam-dark">
                Tempkite paveiksliuką čia
              </span>
              <span className="text-sm text-muted-foreground">
                {" "}
                arba paspauskite
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              JPEG, PNG, GIF, WebP — iki 5MB
            </span>
          </div>
        )}
      </div>

      {/* URL input toggle */}
      {!showUrlInput ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowUrlInput(true)}
          className="text-xs text-muted-foreground gap-1"
        >
          <LinkIcon className="h-3 w-3" />
          Arba įveskite URL
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlSubmit())}
            className="bg-white text-sm h-9"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            className="h-9 bg-primary text-white"
          >
            Pridėti
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowUrlInput(false)
              setUrlInput("")
            }}
            className="h-9"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
