"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import { useState } from "react"

interface ErrorAlertProps {
  message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-5">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 hover:bg-red-100 rounded-full p-1 transition-colors"
          aria-label="Fechar alerta"
        >
          <X className="h-3 w-3" />
        </button>
      </AlertDescription>
    </Alert>
  )
}
