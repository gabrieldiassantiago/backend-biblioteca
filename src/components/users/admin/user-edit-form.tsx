"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateStudent } from "../../../app/(admin)/admin/users/[id]/actions"
import { AlertCircle, CheckCircle, Loader2, User, Phone, Mail, GraduationCap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface Student {
  id: string
  full_name: string
  email: string
  class?: string
  grade?: string
  role: string
  library_id: string
  observations?: string
  phone?: string
}

export function UserEditForm({ student }: { student: Student }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState({
    full_name: student.full_name,
    email: student.email,
    class: student.class || "",
    grade: student.grade || "",
    phone: student.phone || "",
    observations: student.observations || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (message) setMessage(null)
  }

  const handleGradeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, grade: value }))
    if (message) setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    try {
      const result = await updateStudent(student.id, {
        ...formData,
        library_id: student.library_id,
      })
      if (result.success) {
        setMessage({ type: "success", text: "Informações do aluno atualizadas com sucesso!" })
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setMessage({ type: "error", text: result.error || "Erro ao atualizar informações." })
      }
    } catch {
      setMessage({ type: "error", text: "Ocorreu um erro ao processar sua solicitação." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {message && (
        <Alert
          variant={message.type === "success" ? "default" : "destructive"}
          className={message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : ""}
        >
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Dados básicos do aluno</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nome Completo *
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Nome completo do aluno"
                  required
                  className="focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  required
                  className="focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Telefone do Responsável
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    const formattedValue = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
                    handleChange({
                      target: {
                        name: "phone",
                        value: formattedValue,
                      },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }}
                  placeholder="(99) 99999-9999"
                  className="focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  Turma
                </Label>
                <Input
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  placeholder="Ex: Turma A, Turma B"
                  className="focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                Série/Ano
              </Label>
              <Select value={formData.grade} onValueChange={handleGradeChange} name="grade">
                <SelectTrigger className="focus-visible:ring-primary/30">
                  <SelectValue placeholder="Selecione a série/ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Ensino Fundamental</SelectLabel>
                    <SelectItem value="6º Ano - Fundamental">6º Ano - Fundamental</SelectItem>
                    <SelectItem value="7º Ano - Fundamental">7º Ano - Fundamental</SelectItem>
                    <SelectItem value="8º Ano - Fundamental">8º Ano - Fundamental</SelectItem>
                    <SelectItem value="9º Ano - Fundamental">9º Ano - Fundamental</SelectItem>
                  </SelectGroup>
                  <Separator className="my-1" />
                  <SelectGroup>
                    <SelectLabel>Ensino Médio</SelectLabel>
                    <SelectItem value="1º Ano - Médio">1º Ano - Médio</SelectItem>
                    <SelectItem value="2º Ano - Médio">2º Ano - Médio</SelectItem>
                    <SelectItem value="3º Ano - Médio">3º Ano - Médio</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                placeholder="Adicione observações importantes sobre o aluno..."
                className="min-h-[120px] focus-visible:ring-primary/30 resize-y"
              />
              <p className="text-sm text-muted-foreground">
                Adicione informações relevantes como comportamento, necessidades especiais, histórico de atrasos, etc.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-6 flex flex-col sm:flex-row justify-end gap-3 border-t">
            <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/admin/users">Cancelar</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[160px] bg-primary text-white hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
