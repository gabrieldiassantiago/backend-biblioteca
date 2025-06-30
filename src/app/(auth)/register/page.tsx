"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, User, Lock, Library, MapPin, AtSign } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [libraryName, setLibraryName] = useState("")
  const [location, setLocation] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Verificação de autenticação e papel do usuário
  

  // Função para verificar se a biblioteca já existe
  const checkLibraryExists = async (name: string) => {
    console.log("Verificando se a biblioteca já existe:", name)
    try {
      const { data, error } = await supabase
        .from("libraries")
        .select("id")
        .eq("name", name)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao verificar biblioteca:", error)
        return false
      }

      return !!data
    } catch (err) {
      console.error("Exceção ao verificar biblioteca:", err)
      return false
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log("Iniciando processo de registro")

    if (!libraryName) {
      setError("O nome da biblioteca é obrigatório.")
      setLoading(false)
      console.error("Nome da biblioteca não fornecido")
      return
    }

    if (!location) {
      setError("O endereço da biblioteca é obrigatório.")
      setLoading(false)
      console.error("Endereço da biblioteca não fornecido")
      return
    }

    if (!contactEmail) {
      setError("O email de contato da biblioteca é obrigatório.")
      setLoading(false)
      console.error("Email de contato da biblioteca não fornecido")
      return
    }

    const libraryExists = await checkLibraryExists(libraryName)
    if (libraryExists) {
      setError("Já existe uma biblioteca com este nome. Por favor, escolha outro nome.")
      setLoading(false)
      console.error("Biblioteca já existe:", libraryName)
      return
    }

    console.log("Criando usuário com email:", email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "admin" },
      },
    })

    if (error) {
      console.error("Erro ao criar usuário:", error)
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      console.log("Usuário criado com sucesso:", data.user.id)

      console.log("Criando biblioteca:", libraryName)
      const { data: library, error: libraryError } = await supabase
        .from("libraries")
        .insert({
          name: libraryName,
          location: location,
          contact_email: contactEmail,
        })
        .select("id")
        .single()

      if (libraryError) {
        console.error("Erro ao criar biblioteca:", libraryError)
        setError("Erro ao criar biblioteca. Tente novamente.")
        setLoading(false)
        return
      }

      console.log("Biblioteca criada com sucesso:", library.id)

      console.log("Associando usuário à biblioteca")
      const { error: userError } = await supabase.from("users").insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: "admin",
        library_id: library.id,
      })

      if (userError) {
        console.error("Erro ao associar usuário à biblioteca:", userError)
        setError("Erro ao finalizar registro. Tente novamente.")
        setLoading(false)
        return
      }

      console.log("Registro completo, redirecionando para /admin")
      router.push("/admin")
    }
  }

  useEffect(() => {
    const input = document.getElementById("fullName")
    if (input) input.focus()
    console.log("Página de registro carregada")
  }, [])

  useEffect(() => {
    if (email && !contactEmail) {
      setContactEmail(email)
    }
  }, [email, contactEmail])
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

              {/* Library Location Input (Novo) */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Endereço da Biblioteca
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="location"
                    type="text"
                    placeholder="Endereço completo da escola/biblioteca"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Library Contact Email Input (Novo) */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">
                  Email de Contato da Biblioteca
                </Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contato@biblioteca.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
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