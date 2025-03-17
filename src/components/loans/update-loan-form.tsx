"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, Loader2, X } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { updateLoanStatus, extendLoanDueDate } from "../../app/(admin)/admin/loans/actions";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function SubmitButton({ children, variant = "ghost", className }: { 
  children: React.ReactNode; 
  variant?: "ghost" | "destructive" | "success"; 
  className?: string;
}) {
  const { pending } = useFormStatus();
  
  const variantClasses = {
    ghost: "text-blue-600 hover:bg-blue-50 hover:text-blue-700",
    destructive: "text-red-600 hover:bg-red-50 hover:text-red-700",
    success: "text-green-600 hover:bg-green-50 hover:text-green-700"
  };

  return (
    <Button 
      type="submit" 
      className={cn(
        "w-full text-left px-3 py-2 justify-start font-medium transition-all",
        variantClasses[variant],
        className
      )} 
      variant="ghost" 
      disabled={pending}
    >
      {pending ? (
        <span className="flex items-center">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          Processando...
        </span>
      ) : children}
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
      toast.success("Prazo estendido com sucesso!");
    } catch (error) {
      console.error("Erro ao estender prazo:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao estender prazo");
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
      toast.success(`Status atualizado para ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error(`Erro ao atualizar status para ${newStatus}:`, error);
      toast.error(error instanceof Error ? error.message : `Erro ao atualizar status para ${newStatus}`);
      setError(error instanceof Error ? error.message : `Erro ao atualizar status para ${newStatus}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "active": return "Ativo";
      case "returned": return "Devolvido";
      case "overdue": return "Atrasado";
      case "rejected": return "Rejeitado";
      default: return status;
    }
  };

  // Renderizar opções com base no status atual
  const renderOptions = () => {
    switch (currentStatus) {
      case "pending":
        return (
          <div className="space-y-0.5">
            <form action={handleStatusSubmit.bind(null, "active")}>
              <SubmitButton variant="success" className="rounded-md">
                <Check className="mr-2 h-4 w-4" />
                Aceitar
              </SubmitButton>
            </form>
            <form action={handleStatusSubmit.bind(null, "rejected")}>
              <SubmitButton variant="destructive" className="rounded-md">
                <X className="mr-2 h-4 w-4" />
                Rejeitar
              </SubmitButton>
            </form>
          </div>
        );
      case "active":
      case "overdue":
        return (
          <div className="space-y-0.5">
            <form action={handleStatusSubmit.bind(null, "returned")}>
              <SubmitButton variant="success" className="rounded-md">
                <Check className="mr-2 h-4 w-4" />
                Marcar como Devolvido
              </SubmitButton>
            </form>
            <div className="pt-1 mt-1 border-t border-gray-100">
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-3 py-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-md"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Estender prazo</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded-lg" align="start">
                  <div className="p-3">
                    <div className="mb-2 text-sm font-medium text-gray-700">
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
                      className="rounded-md border border-gray-200"
                    />
                    <form action={handleExtendSubmit} className="mt-3">
                      <input type="hidden" name="dueDate" value={date ? format(date, "yyyy-MM-dd") : ""} />
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                        disabled={!date || isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </span>
                        ) : "Confirmar nova data"}
                      </Button>
                    </form>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );
      case "rejected":
      case "returned":
        return (
          <div className="text-gray-500 text-sm px-3 py-2 italic">
            Nenhuma ação disponível
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-w-[200px]">
      {error && (
        <div className="text-red-500 text-xs px-3 py-2 bg-red-50 rounded-md mb-2">{error}</div>
      )}
      {renderOptions()}
    </div>
  );
}
