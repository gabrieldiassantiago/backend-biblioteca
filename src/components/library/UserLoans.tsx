"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, BookOpen, Calendar, AlertCircle, Loader2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Interface para o livro aninhado
interface Book {
  title: string;
  author: string;
}

// Interface para o empréstimo (atualizada com novos status)
interface Loan {
  id: string;
  book: Book;
  borrowed_at: string;
  due_date: string;
  status: "pending" | "active" | "returned" | "overdue" | "rejected"; // Adicionado "pending" e "rejected"
}

interface UserLoansProps {
  userId: string | undefined;
  onClose: () => void;
}

export default function UserLoans({ userId, onClose }: UserLoansProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLoans() {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedLoans = await import("../../app/biblioteca/[slug]/actions").then((mod) => mod.fetchUserLoans(userId));
        setLoans(fetchedLoans);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadLoans();
  }, [userId]);

  // Função para determinar o status do empréstimo (atualizada para novos status)
  const getLoanStatus = (loan: Loan): "pending" | "active" | "returned" | "overdue" | "rejected" | "due-soon" => {
    const dueDate = new Date(loan.due_date);
    const today = new Date();

    // Priorizar status explícitos
    if (loan.status === "pending") return "pending";
    if (loan.status === "rejected") return "rejected";
    if (loan.status === "returned") return "returned";
    
    // Lógica para status "active" e derivados
    if (loan.status !== "active") return "returned";
    if (dueDate < today) return "overdue";
    
    // Se a data de devolução está a 2 dias ou menos
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(today.getDate() + 2);
    if (dueDate <= twoDaysFromNow) return "due-soon";
    
    return "active";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full max-w-3xl mx-auto"
    >
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="relative bg-gradient-to-r from-violet-500 to-indigo-600 pb-6">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/20 rounded-full"></div>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Meus Empréstimos
            </CardTitle>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              size="icon"
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-center">Carregando seus empréstimos...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-red-500 dark:text-red-400 text-center font-medium mb-2">Erro ao carregar empréstimos</p>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm">{error}</p>
            </div>
          ) : loans.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              <AnimatePresence>
                {loans.map((loan, index) => {
                  const status = getLoanStatus(loan);
                  
                  return (
                    <motion.li 
                      key={loan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                                {loan.book.title}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {loan.book.author}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:items-end gap-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Emprestado: {new Date(loan.borrowed_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Devolução: {new Date(loan.due_date).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          
                          <Badge className={`mt-1 ${
                            status === 'pending' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                            status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            status === 'returned' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            status === 'due-soon' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' // active
                          }`}>
                            {status === 'pending' ? 'Pendente' :
                             status === 'rejected' ? 'Rejeitado' :
                             status === 'returned' ? 'Devolvido' :
                             status === 'overdue' ? 'Atrasado' :
                             status === 'due-soon' ? 'Vence em breve' :
                             'Ativo'}
                          </Badge>
                          {status === 'pending' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Este empréstimo ainda está aguardando aprovação pela biblioteca.
                            </p>
                          )}
                          {status === 'rejected' && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                              Este empréstimo foi rejeitado pela biblioteca.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum empréstimo encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                Você não tem empréstimos ativos no momento. Explore a biblioteca para encontrar livros interessantes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}