"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Loader2, X, Clock, ArrowRight, Star, StarIcon as StarOutline } from 'lucide-react'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useFormStatus } from "react-dom"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { extendLoanDueDate, updateLoanStatus } from "@/app/(admin)/admin/loans/actions"

// Mini StarPicker component
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="focus:outline-none transition-colors">
          {i <= value ? (
            <Star className="h-6 w-6 text-yellow-400 hover:text-yellow-500" />
          ) : (
            <StarOutline className="h-6 w-6 text-gray-300 hover:text-gray-400" />
          )}
        </button>
      ))}
    </div>
  )
}

// Custom SubmitButton to handle pending state
function SubmitButton({
  children,
  variant = "ghost",
  className,
  icon,
}: {
  children: React.ReactNode
  variant?: "ghost" | "destructive" | "success"
  className?: string
  icon?: React.ReactNode
}) {
  const { pending } = useFormStatus()
  const variantClasses = {
    ghost: "text-blue-600 hover:bg-blue-50 hover:text-blue-700",
    destructive: "text-red-600 hover:bg-red-50 hover:text-red-700",
    success: "text-green-600 hover:bg-green-50 hover:text-green-700",
  }

  return (
    <Button
      type="submit"
      variant="ghost"
      className={cn(
        "w-full text-left px-3 py-2.5 justify-start font-medium transition-all",
        variantClasses[variant],
        className,
      )}
      disabled={pending}
    >
      {pending ? (
        <span className="flex items-center">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          Processando...
        </span>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  )
}

export function UpdateLoanForm({
  loanId,
  currentDueDate,
  currentStatus,
}: {
  loanId: string
  currentDueDate: string
  currentStatus: "pending" | "active" | "returned" | "overdue" | "rejected"
}) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [date, setDate] = useState<Date>(new Date(currentDueDate))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnDate, setReturnDate] = useState<Date>(new Date())
  const [returnObservation, setReturnObservation] = useState("")
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState("")

  const handleExtendSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await extendLoanDueDate(loanId, formData)
      setShowCalendar(false)
      toast.success("Prazo estendido com sucesso!")
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Erro ao estender prazo")
      setError(err instanceof Error ? err.message : "Erro ao estender prazo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusSubmit = async (
    newStatus: "pending" | "active" | "returned" | "overdue" | "rejected",
  ) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await updateLoanStatus(loanId, newStatus)
      toast.success(`Status atualizado para ${newStatus}`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status")
      setError(err instanceof Error ? err.message : "Erro ao atualizar status")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReturnSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const formData = new FormData()
      formData.append("returnDate", returnDate ? format(returnDate, "yyyy-MM-dd") : "")
      formData.append("observation", returnObservation)
      formData.append("rating", String(rating))
      formData.append("comment", ratingComment)

      await updateLoanStatus(loanId, "returned", formData)
      setShowReturnModal(false)
      toast.success("Empréstimo marcado como devolvido com sucesso!")
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Erro ao registrar devolução")
      setError(err instanceof Error ? err.message : "Erro ao registrar devolução")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderOptions = () => {
    switch (currentStatus) {
      case "pending":
        return (
          <div className="space-y-1">
            <form action={() => handleStatusSubmit("active")}>
              <SubmitButton
                variant="success"
                className="rounded-md hover:translate-x-0.5 transition-transform"
                icon={<Check className="mr-2 h-4 w-4" />}
              >
                Aceitar
              </SubmitButton>
            </form>
            <form action={() => handleStatusSubmit("rejected")}>
              <SubmitButton
                variant="destructive"
                className="rounded-md hover:translate-x-0.5 transition-transform"
                icon={<X className="mr-2 h-4 w-4" />}
              >
                Rejeitar
              </SubmitButton>
            </form>
          </div>
        )
      case "active":
      case "overdue":
        return (
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start px-3 py-2.5 text-green-600 hover:bg-green-50 hover:text-green-700 rounded-md hover:translate-x-0.5 transition-transform"
              onClick={() => setShowReturnModal(true)}
            >
              <Check className="mr-2 h-4 w-4" />
              Marcar como Devolvido
            </Button>
            <div className="pt-1 mt-1 border-t border-gray-100">
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-md hover:translate-x-0.5 transition-transform"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Estender prazo</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded-lg" align="start">
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between text-sm font-medium">
                      <span className="text-gray-700">Data atual:</span>
                      <span className="font-semibold text-blue-600">
                        {format(new Date(currentDueDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      initialFocus
                      disabled={(d) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return d < today
                      }}
                      className="rounded-md border border-gray-200"
                    />
                    <form action={(fd) => handleExtendSubmit(fd)} className="mt-4">
                      <input type="hidden" name="dueDate" value={date ? format(date, "yyyy-MM-dd") : ""} />
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-gray-700">Nova data:</span>
                        <span className="font-semibold text-green-600">
                          {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                        </span>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all"
                        disabled={!date || isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Confirmar nova data
                          </span>
                        )}
                      </Button>
                    </form>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )
      case "rejected":
      case "returned":
        return (
          <div className="px-3 py-2.5 text-sm italic text-gray-500">Nenhuma ação disponível</div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-w-[220px]">
      {error && (
        <div className="mb-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-500">
          <div className="flex items-center">
            <X className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
      {renderOptions()}

      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Registrar Devolução</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Data de devolução */}
            <div className="space-y-2">
              <Label htmlFor="return-date" className="text-sm font-medium">
                Data de Devolução
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="return-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-11"
                  >
                    {returnDate ? format(returnDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={(newDate) => newDate && setReturnDate(newDate)}
                    initialFocus
                    disabled={(d) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return d > today
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="observation" className="text-sm font-medium">
                Observação
              </Label>
              <Textarea
                id="observation"
                placeholder="Comentário sobre a devolução (opcional)"
                value={returnObservation}
                onChange={(e) => setReturnObservation(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Avaliação do aluno */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Avaliação do Aluno *</Label>
              <div className="space-y-3">
                <StarPicker value={rating} onChange={setRating} />
                <Textarea
                  placeholder="Comentário sobre o comportamento do aluno (opcional)"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowReturnModal(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleReturnSubmit}
              disabled={isSubmitting || !returnDate || rating === 0}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </span>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar Devolução
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
