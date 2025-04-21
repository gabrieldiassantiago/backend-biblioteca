"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, BookOpen, CheckCircle, UserPlus, LogIn, Mail, Lock, User, Calendar, School } from 'lucide-react';
import { handleRegisterAndBorrow, handleBorrow, handleLogin } from "../../app/biblioteca/[slug]/actions";
import { User as UserType } from "@/types/lbrary";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  libraryId: string;
  slug: string;
  user: UserType | null;
}

export default function BorrowModal({ isOpen, onClose, bookId, libraryId, slug, user }: BorrowModalProps) {
  const [isRegistering, setIsRegistering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await handleRegisterAndBorrow(formData);
      if (result.success) {
        setSuccess(result.message);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await handleLogin(formData);
      if (result.success) {
        setSuccess(result.message);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrowSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await handleBorrow(formData);
      if (result.success) {
        setSuccess(result.message);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden"
      >
        <div className="relative h-24 bg-gradient-to-r from-violet-500 to-indigo-600 overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/20 rounded-full"></div>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-4 left-6 right-6 z-10">
            <h2 className="text-2xl font-bold text-white">
              {success ? "Sucesso!" : isAuthenticated ? "Empréstimo de Livro" : isRegistering ? "Crie sua conta" : "Acesse sua conta"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 pt-8">
          {success ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">{success}</p>
              <Button 
                onClick={onClose} 
                className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium py-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Fechar
              </Button>
            </motion.div>
          ) : isAuthenticated ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Prazo de entrega: <span className="font-semibold text-indigo-600 dark:text-indigo-400">7 dias</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Confirme o empréstimo abaixo
                  </p>
                </div>
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl mb-6 text-sm border border-red-100 dark:border-red-800/50"
                >
                  {error}
                </motion.div>
              )}
              
              <form onSubmit={handleBorrowSubmit}>
                <input type="hidden" name="bookId" value={bookId} />
                <input type="hidden" name="libraryId" value={libraryId} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="userId" value={user?.id || ""} />
                
                <div className="flex justify-end space-x-3 mt-4">
                  <Button 
                    type="button" 
                    onClick={onClose} 
                    variant="outline" 
                    className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-5 rounded-xl"
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium px-5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando
                      </div>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Confirmar Empréstimo
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl mb-6 text-sm border border-red-100 dark:border-red-800/50"
                >
                  {error}
                </motion.div>
              )}
              
              <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} className="space-y-5">
                <input type="hidden" name="bookId" value={bookId} />
                <input type="hidden" name="libraryId" value={libraryId} />
                <input type="hidden" name="slug" value={slug} />

               {isRegistering && (
  <>
    <div className="space-y-2">
      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Nome completo
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Digite seu nome completo"
          required
          className="pl-10 py-6 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
        />
      </div>
    </div>

    <div className="space-y-2">
      <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Turma
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <School className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          id="class"
          name="class"
          placeholder="Ex.: A, B, Turma 1"
          required
          className="pl-10 py-6 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
        />
      </div>
    </div>

    <div className="space-y-2">
      <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Série/Ano
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <School className="h-5 w-5 text-gray-400" />
        </div>
        <Select name="grade" required>
          <SelectTrigger
            id="grade"
            className="pl-10 py-6 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <SelectValue placeholder="Selecione a série/ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6º ano Fundamental">6º ano Fundamental</SelectItem>
            <SelectItem value="7º ano Fundamental">7º ano Fundamental</SelectItem>
            <SelectItem value="8º ano Fundamental">8º ano Fundamental</SelectItem>
            <SelectItem value="9º ano Fundamental">9º ano Fundamental</SelectItem>
            <SelectItem value="1º ano Médio">1º ano Médio</SelectItem>
            <SelectItem value="2º ano Médio">2º ano Médio</SelectItem>
            <SelectItem value="3º ano Médio">3º ano Médio</SelectItem>
          </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input 
                      id="email" 
                      type="email" 
                      name="email" 
                      placeholder="seu@email.com" 
                      required 
                      className="pl-10 py-6 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      required
                      className="pl-10 py-6 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-0 font-medium"
                  >
                    {isRegistering ? "Já tenho conta" : "Criar conta"}
                  </Button>

                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium px-6 py-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando
                      </div>
                    ) : isRegistering ? (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Registrar
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Entrar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}