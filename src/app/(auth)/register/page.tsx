"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, User, Lock, Library } from "lucide-react"
import Image from "next/image"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [libraryName, setLibraryName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!libraryName) {
      setError("O nome da biblioteca é obrigatório.")
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "admin" }, // Define role como 'admin' por padrão
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      // Criar a biblioteca
      const { data: library, error: libraryError } = await supabase
        .from("libraries")
        .insert({ name: libraryName })
        .select("id")
        .single()

      if (libraryError) {
        setError("Erro ao criar biblioteca. Tente novamente.")
        setLoading(false)
        return
      }

      // Inserir na tabela users como admin, associado à biblioteca
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: "admin",
        library_id: library.id,
      })

      window.location.href = "/admin"
    }
  }

  useEffect(() => {
    const input = document.getElementById("fullName")
    if (input) input.focus()
  }, [])

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      <div className="hidden lg:flex w-1/2 bg-primary justify-center items-center relative overflow-hidden">
        <div className="absolute top-10 left-10">
        </div>
        <div className="relative z-10 text-center px-8 max-w-md">
         
          <Image src="/logounisal.svg" alt="Logo UNISAL" width={500} height={500} className="" />
       
        </div>
      </div>

      {/* Right Section - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl shadow-sm">
          <div className="text-center space-y-2">
            <div className="flex justify-center lg:hidden mb-4">
              <Image src="/logounisal.svg" alt="Logo UNISAL" width={150} height={50} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Registrar Administrador</h2>
            <p className="text-gray-500 text-sm">Preencha os dados para criar sua conta</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-4">
              {/* Full Name Input */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu Nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Library Name Input */}
              <div className="space-y-2">
                <Label htmlFor="libraryName" className="text-sm font-medium text-gray-700">
                  Nome da Biblioteca
                </Label>
                <div className="relative">
                  <Library className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="libraryName"
                    type="text"
                    placeholder="Nome da Biblioteca"
                    value={libraryName}
                    onChange={(e) => setLibraryName(e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full font-medium h-12 rounded-lg text-base" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">ou</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-gray-500">Já tem conta? </span>
              <Link href="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Faça login
              </Link>
            </div>
          </form>

          <div className="pt-4 text-center">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} UNISAL. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

