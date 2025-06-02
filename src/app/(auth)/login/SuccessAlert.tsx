"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

interface SuccessAlertProps {
  message: string
}

export function SuccessAlert({ message }: SuccessAlertProps) {
  return (
    <Alert className="border-green-200 bg-green-50 text-green-800 animate-in fade-in-50 slide-in-from-top-5">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-700">{message}</AlertDescription>
    </Alert>
  )
}
