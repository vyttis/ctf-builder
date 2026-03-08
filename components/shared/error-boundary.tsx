"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-steam-dark mb-1">
            {this.props.fallbackTitle || "Kažkas nutiko ne taip"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {this.props.fallbackMessage ||
              "Įvyko netikėta klaida. Pabandykite atnaujinti puslapį."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Bandyti dar kartą
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
