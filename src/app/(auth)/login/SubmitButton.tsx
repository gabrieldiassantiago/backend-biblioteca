"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

// Define the props interface for SubmitButton
interface SubmitButtonProps {
  success: boolean;
}

export function SubmitButton({ success }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || success}
      className="w-full font-semibold h-12 rounded-xl text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-lg"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Entrando...
        </>
      ) : success ? (
        "Sucesso!"
      ) : (
        "Entrar"
      )}
    </Button>
  );
}
