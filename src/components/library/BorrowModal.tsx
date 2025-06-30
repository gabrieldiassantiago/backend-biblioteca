"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, BookOpen, CheckCircle, UserPlus, LogIn, Mail, Lock, User, Calendar, School, Eye, EyeOff } from 'lucide-react';
import { handleRegisterAndBorrow, handleBorrow, handleLogin } from "../../app/biblioteca/[slug]/actions";
import { User as UserType } from "@/types/lbrary";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Progress } from "@/components/ui/progress";

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
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    class: '',
    grade: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  const getProgressValue = () => {
    if (success) return 100;
    if (user) return 75;
    if (isRegistering) {
      const fields = [formData.fullName, formData.email, formData.password, formData.class, formData.grade];
      const filledFields = fields.filter(field => field.trim() !== '').length;
      return (filledFields / fields.length) * 50;
    } else {
      const fields = [formData.email, formData.password];
      const filledFields = fields.filter(field => field.trim() !== '').length;
      return (filledFields / fields.length) * 50;
    }
  };

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800"
      >
        {/* Header with Progress */}
        <div className="relative h-32 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full"></div>
          
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-white">
                {success ? "Sucesso!" : isAuthenticated ? "Empréstimo" : isRegistering ? "Criar Conta" : "Entrar"}
              </h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {!success && (
              <div className="space-y-2">
                <div className="flex justify-between text-white/80 text-xs">
                  <span>Progresso</span>
                  <span>{Math.round(getProgressValue())}%</span>
                </div>
                <Progress value={getProgressValue()} className="h-1.5 bg-white/20" />
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Tudo certo!</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{success}</p>
                <Button 
                  onClick={onClose} 
                  className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  Perfeito!
                </Button>
              </motion.div>
            ) : isAuthenticated ? (
              <motion.div 
                key="borrow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-start gap-4 mb-8 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Prazo de Devolução</h4>
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-1">7 dias corridos</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Confirme abaixo para finalizar o empréstimo
                    </p>
                  </div>
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl text-sm border border-red-200 dark:border-red-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <form onSubmit={handleBorrowSubmit}>
                  <input type="hidden" name="bookId" value={bookId} />
                  <input type="hidden" name="libraryId" value={libraryId} />
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="userId" value={user?.id || ""} />
                  
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      onClick={onClose} 
                      variant="outline" 
                      className="flex-1 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 py-4 rounded-xl"
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-[2] bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Processando...
                        </div>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-5 w-5" />
                          Confirmar Empréstimo
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Toggle Buttons */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      !isRegistering 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <LogIn className="w-4 h-4 inline mr-2" />
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isRegistering 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Criar Conta
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl text-sm border border-red-200 dark:border-red-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence mode="wait">
                  <motion.form 
                    key={isRegistering ? 'register' : 'login'}
                    initial={{ opacity: 0, x: isRegistering ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRegistering ? -20 : 20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} 
                    className="space-y-6"
                  >
                    <input type="hidden" name="bookId" value={bookId} />
                    <input type="hidden" name="libraryId" value={libraryId} />
                    <input type="hidden" name="slug" value={slug} />

                    {isRegistering && (
                      <>
                        <div className="grid grid-cols-1 gap-6">
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-2"
                          >
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Nome completo
                            </label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                              </div>
                              <Input
                                id="fullName"
                                name="fullName"
                                placeholder="Digite seu nome completo"
                                required
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className="pl-12 py-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all duration-200"
                              />
                            </div>
                          </motion.div>

                          <div className="grid grid-cols-2 gap-4">
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="space-y-2"
                            >
                              <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Turma
                              </label>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                                  <School className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <Input
                                  id="class"
                                  name="class"
                                  placeholder="Ex.: A, B"
                                  required
                                  value={formData.class}
                                  onChange={(e) => handleInputChange('class', e.target.value)}
                                  className="pl-12 py-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all duration-200"
                                />
                              </div>
                            </motion.div>

                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="space-y-2"
                            >
                              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Série/Ano
                              </label>
                              <Select name="grade" required value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                                <SelectTrigger className="py-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="6º ano Fundamental">6º ano</SelectItem>
                                  <SelectItem value="7º ano Fundamental">7º ano</SelectItem>
                                  <SelectItem value="8º ano Fundamental">8º ano</SelectItem>
                                  <SelectItem value="9º ano Fundamental">9º ano</SelectItem>
                                  <SelectItem value="1º ano Médio">1º ano Médio</SelectItem>
                                  <SelectItem value="2º ano Médio">2º ano Médio</SelectItem>
                                  <SelectItem value="3º ano Médio">3º ano Médio</SelectItem>
                                </SelectContent>
                              </Select>
                            </motion.div>
                          </div>
                        </div>
                      </>
                    )}

                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: isRegistering ? 0.4 : 0.1 }}
                      className="space-y-2"
                    >
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <Input 
                          id="email" 
                          type="email" 
                          name="email" 
                          placeholder="seu@email.com" 
                          required 
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="pl-12 py-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all duration-200" 
                        />
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: isRegistering ? 0.5 : 0.2 }}
                      className="space-y-2"
                    >
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Senha
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="••••••••"
                          required
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="pl-12 pr-12 py-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: isRegistering ? 0.6 : 0.3 }}
                      className="pt-4"
                    >
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Processando...
                          </div>
                        ) : isRegistering ? (
                          <>
                            <UserPlus className="mr-2 h-5 w-5" />
                            Criar Conta e Emprestar
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-5 w-5" />
                            Entrar e Emprestar
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
