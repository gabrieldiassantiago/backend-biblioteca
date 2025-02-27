"use client"

import type React from "react"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { updateLoanStatus, extendLoanDueDate } from "./actions"
import { useFormStatus } from "react-dom"

// Componente para o botão de submissão com estado de carregamento
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full text-left px-2 py-1 hover:bg-gray-100" variant="ghost" disabled={pending}>
      {pending ? "Processando..." : children}
    </Button>
  )
}

export function UpdateLoanForm({
  loanId,
  currentDueDate,
}: {
  loanId: string
  currentDueDate: string
}) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [date, setDate] = useState<Date | undefined>(currentDueDate ? new Date(currentDueDate) : undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)


  // Função para lidar com a submissão do formulário de extensão
  const handleExtendSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      await extendLoanDueDate(loanId, formData)
      setShowCalendar(false)
    } catch (error) {
      console.error("Erro ao estender prazo:", error)
      alert(error instanceof Error ? error.message : "Erro ao estender prazo")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col space-y-1">
      <form action={updateLoanStatus.bind(null, loanId, "active")}>
        <SubmitButton>Ativo</SubmitButton>
      </form>

      <form action={updateLoanStatus.bind(null, loanId, "returned")}>
        <SubmitButton>Devolvido</SubmitButton>
      </form>

      <form action={updateLoanStatus.bind(null, loanId, "overdue")}>
        <SubmitButton>Atrasado</SubmitButton>
      </form>

      <div className="border-t my-1 pt-1">
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-2 py-1 hover:bg-gray-100">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Estender prazo</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-2">
              <div className="mb-2 text-sm text-muted-foreground">
                Data atual: {format(new Date(currentDueDate), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today
                }}
              />
              <form action={handleExtendSubmit} className="mt-2">
                <input type="hidden" name="dueDate" value={date ? format(date, "yyyy-MM-dd") : ""} />
                <Button type="submit" className="w-full" disabled={!date || isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Confirmar nova data"}
                </Button>
              </form>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

