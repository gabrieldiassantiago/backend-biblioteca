"use client"

import { useFormState } from "react-dom"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock } from "lucide-react"
import { SubmitButton } from "./SubmitButton"
import { ErrorAlert } from "./ErrorAlert"
import { SuccessAlert } from "./SuccessAlert"
import { loginAction } from "./actions"

export function LoginForm() {
  const router = useRouter()
  const [state, formAction] = useFormState(loginAction, {
    error: null,
    success: false,
  })

  // Redirecionar quando login for bem-sucedido
  useEffect(() => {
    if (state.success && state.redirectTo) {
      // Pequeno delay para mostrar o feedback de sucesso
      const timer = setTimeout(() => {
        router.push(state.redirectTo!)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [state.success, state.redirectTo, router])

  return (
    <>
      {/* Error Alert */}
      {state.error && (
        <div className="mb-6">
          <ErrorAlert message={state.error} />
        </div>
      )}

      {/* Success Alert */}
      {state.success && (
        <div className="mb-6">
          <SuccessAlert message="Login realizado com sucesso! Redirecionando..." />
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              disabled={state.success}
              className="pl-10 h-12 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50/50 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Senha
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={state.success}
              className="pl-10 h-12 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50/50 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <SubmitButton  success={state.success} />
        </div>
      </form>
    </>
  )
}
