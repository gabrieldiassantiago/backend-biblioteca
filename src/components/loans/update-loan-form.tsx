"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { updateLoanStatus, extendLoanDueDate } from "../../app/(admin)/admin/loans/actions";
import { useFormStatus } from "react-dom";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      className="w-full text-left px-2 py-1 hover:bg-blue-600" 
      variant="ghost" 
      disabled={pending}
    >
      {pending ? "Processando..." : children}
    </Button>
  );
}

export function UpdateLoanForm({
  loanId,
  currentDueDate,
  currentStatus,
}: {
  loanId: string;
  currentDueDate: string;
  currentStatus: "pending" | "active" | "returned" | "overdue" | "rejected";
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [date, setDate] = useState<Date | undefined>(currentDueDate ? new Date(currentDueDate) : undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtendSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await extendLoanDueDate(loanId, formData);
      setShowCalendar(false);
    } catch (error) {
      console.error("Erro ao estender prazo:", error);
      setError(error instanceof Error ? error.message : "Erro ao estender prazo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusSubmit = async (newStatus: "pending" | "active" | "returned" | "overdue" | "rejected") => {
    try {
      setIsSubmitting(true);
      setError(null);
      await updateLoanStatus(loanId, newStatus);
    } catch (error) {
      console.error(`Erro ao atualizar status para ${newStatus}:`, error);
      setError(error instanceof Error ? error.message : `Erro ao atualizar status para ${newStatus}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar opções com base no status atual
  const renderOptions = () => {
    switch (currentStatus) {
      case "pending":
        return (
          <>
            <form action={handleStatusSubmit.bind(null, "active")}>
              <SubmitButton>Aceitar</SubmitButton>
            </form>
            <form action={handleStatusSubmit.bind(null, "rejected")}>
              <SubmitButton>Rejeitar</SubmitButton>
            </form>
          </>
        );
      case "active":
      case "overdue":
        return (
          <>
            <form action={handleStatusSubmit.bind(null, "returned")}>
              <SubmitButton>Devolvido</SubmitButton>
            </form>
            <div className="border-t border-blue-200 my-1 pt-1">
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-2 py-1 hover:bg-blue-600 text-blue-600 hover:text-white"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Estender prazo</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-blue-200" align="start">
                  <div className="p-2">
                    <div className="mb-2 text-sm text-blue-600">
                      Data atual: {format(new Date(currentDueDate), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      className="rounded-md border border-blue-200"
                    />
                    <form action={handleExtendSubmit} className="mt-2">
                      <input type="hidden" name="dueDate" value={date ? format(date, "yyyy-MM-dd") : ""} />
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                        disabled={!date || isSubmitting}
                      >
                        {isSubmitting ? "Salvando..." : "Confirmar nova data"}
                      </Button>
                    </form>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </>
        );
      case "rejected":
      case "returned":
        return (
          <div className="text-gray-500 text-xs px-2 py-1">
            Nenhuma ação disponível
          </div>
        );
      default:
        return null; // Fallback para status inválido (não deve ocorrer)
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      {error && (
        <div className="text-red-500 text-xs px-2 py-1">{error}</div>
      )}
      {renderOptions()}
    </div>
  );
}