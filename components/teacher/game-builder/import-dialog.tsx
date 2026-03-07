"use client"

import { useState, useRef } from "react"
import { AiSuggestion } from "@/lib/ai/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface ImportDialogProps {
  gameTitle: string
  gameDescription: string | null
  onImported: (suggestions: AiSuggestion[]) => void
}

type ImportStep = "upload" | "processing" | "done" | "error"

export function ImportDialog({
  gameTitle,
  gameDescription,
  onImported,
}: ImportDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ImportStep>("upload")
  const [fileName, setFileName] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setStep("processing")
    setErrorMessage("")

    try {
      // Step 1: Upload
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/import/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || "Nepavyko įkelti failo")
      }

      const { storage_path } = await uploadRes.json()

      // Step 2: Process
      const processRes = await fetch("/api/import/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_path,
          game_title: gameTitle,
          game_description: gameDescription,
          count: 5,
        }),
      })

      if (!processRes.ok) {
        const err = await processRes.json()
        throw new Error(err.error || "Nepavyko apdoroti dokumento")
      }

      const { suggestions } = await processRes.json()
      setStep("done")

      toast({ title: `Sugeneruota užduočių: ${suggestions.length}` })
      onImported(suggestions)

      setTimeout(() => {
        setOpen(false)
        setStep("upload")
      }, 1500)
    } catch (error) {
      setStep("error")
      setErrorMessage(
        error instanceof Error ? error.message : "Nežinoma klaida"
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" />
          Importuoti
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importuoti iš dokumento</DialogTitle>
          <DialogDescription>
            Įkelkite PDF, DOCX arba TXT failą — DI sugeneruos užduotis pagal
            turinį
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-steam-dark mb-1">
              Pasirinkite failą
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX arba TXT (maks. 10MB)
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {step === "processing" && (
          <div className="py-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm font-medium text-steam-dark mb-1">
              Apdorojama...
            </p>
            <p className="text-xs text-muted-foreground">
              {fileName} &mdash; generuojamos užduotys
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="text-sm font-medium text-steam-dark">
              Užduotys sugeneruotos!
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="py-8 text-center">
            <AlertCircle className="h-10 w-10 text-accent mx-auto mb-3" />
            <p className="text-sm font-medium text-accent mb-1">Klaida</p>
            <p className="text-xs text-muted-foreground mb-4">
              {errorMessage}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStep("upload")
                setErrorMessage("")
              }}
            >
              Bandyti dar kartą
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
