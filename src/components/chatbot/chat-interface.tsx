"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { Bot, Send, X, Maximize2, Minimize2, Loader2, BookOpen, User, Search, Plus } from 'lucide-react';
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Interface para mensagens atualizada
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean; // Para indicar que o bot está processando esta resposta
  isError?: boolean;   // Para indicar uma mensagem de erro
}

// Interface para sugestões rápidas (inalterada)
interface QuickSuggestion {
  text: string;
  icon?: React.ReactNode;
  action: string;
}

export function LibraryChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Verificar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Sugestões rápidas
  const quickSuggestions: QuickSuggestion[] = [
    { text: "Buscar livros", icon: <Search className="h-3 w-3 mr-1 md:mr-1.5" />, action: "Quais livros estão disponíveis?" },
    { text: "Emprestar livro", icon: <BookOpen className="h-3 w-3 mr-1 md:mr-1.5" />, action: "Como faço para emprestar um livro?" },
    { text: "Adicionar livro", icon: <Plus className="h-3 w-3 mr-1 md:mr-1.5" />, action: "Como adicionar um novo livro?" },
  ];

  // Scroll para o final
  useEffect(() => {
    // Atraso mínimo para permitir que o DOM atualize antes de rolar
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  }, [messages]); // Re-executar sempre que as mensagens mudarem

  // Lidar com a altura do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      const minHeight = 40;
      textareaRef.current.style.height = `${Math.max(minHeight, Math.min(scrollHeight, maxHeight))}px`;
    }
  }, [input]);

  // Ajustar overflow do body
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isOpen && isMobile && isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow || '';
    }
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [isOpen, isExpanded, isMobile]);

  // Verifica se o bot está atualmente processando uma resposta
  const isBotLoading = messages.some(msg => msg.role === 'assistant' && msg.isLoading);

  // Lidar com a submissão do formulário
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isBotLoading) return;

    const userMessageContent = input.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessageContent,
    };

    const assistantPlaceholderId = `bot-placeholder-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantPlaceholderId,
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput("");

    setTimeout(() => textareaRef.current?.focus(), 0);

    try {
      const response = await fetch("/api/library-chat", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           messages: messages
             .filter(msg => !msg.isLoading && !msg.isError)
             .concat(userMessage)
             .map((msg) => ({
               role: msg.role,
               content: msg.content,
             })),
         }),
       });

      if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } catch {}
        throw new Error(errorData?.error || `Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? { ...msg, content: data.content || "Desculpe, não consegui processar isso.", isLoading: false, isError: !data.content }
            : msg
        )
      );

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? {
                ...msg,
                content: `Erro: ${errorMessage}`,
                isLoading: false,
                isError: true,
              }
            : msg
        )
      );
    } finally {
       setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  // Lidar com a tecla Enter
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (e.currentTarget.form && input.trim() && !isBotLoading) {
        e.currentTarget.form.requestSubmit();
      }
    }
  };

  // Lidar com sugestão rápida
  const handleQuickSuggestion = (suggestion: QuickSuggestion) => {
    setInput(suggestion.action);
    textareaRef.current?.focus();
  };

  // Formatar o conteúdo da mensagem
  const formatMessageContent = (content: string) => {
     const formattedContent = content
       .replace(/&/g, "&")
       .replace(/</g, "<")
       .replace(/>/g, ">")
       .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.*?)\*/g, '<em>$1</em>')
       .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
       .replace(/\n/g, '<br>');
     return formattedContent;
  };


  return (
    <>
      {/* Botão Flutuante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-5 right-5 z-50 md:bottom-8 md:right-8"
          >
            <TooltipProvider delayDuration={100}>
               <Tooltip>
                 <TooltipTrigger asChild>
                     <Button
                       aria-label="Abrir chat da biblioteca"
                       onClick={() => setIsOpen(true)}
                       size="lg"
                       className="h-16 w-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-all duration-300 ease-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                     >
                       <Bot className="h-7 w-7" />
                     </Button>
                 </TooltipTrigger>
                 <TooltipContent side="left" className="bg-gray-800 text-white border-gray-700">
                    <p>Abrir Chat AI</p>
                 </TooltipContent>
               </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Janela do Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isMobile && !isExpanded ? 50 : 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile && !isExpanded ? 50 : 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "fixed z-[100] overflow-hidden rounded-t-lg md:rounded-lg shadow-2xl bg-white border border-gray-200/80 dark:bg-gray-900 dark:border-gray-700/80 flex flex-col", // flex flex-col é crucial aqui
              isExpanded
                ? "inset-0 md:inset-6 lg:inset-10"
                : isMobile
                  ? "bottom-0 left-0 right-0 max-h-[80vh] rounded-b-none border-t-2 border-indigo-500"
                  : "bottom-6 right-6 w-[380px] md:w-[420px] max-h-[calc(100vh-80px)] sm:max-h-[650px]"
            )}
            ref={chatContainerRef}
            aria-modal="true"
            role="dialog"
            aria-labelledby="chatbot-title"
          >
            {/* Card ocupa toda a altura e usa flex-col */}
            <Card className="flex h-full w-full flex-col border-0 shadow-none bg-transparent">
              {/* Header Fixo */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-indigo-600 dark:bg-indigo-700 px-4 py-3 text-white flex-shrink-0"> {/* flex-shrink-0 */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 flex justify-center items-center bg-white dark:bg-gray-800 flex-shrink-0">
                    <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </Avatar>
                  <div className="flex flex-col">
                    <h3 id="chatbot-title" className="font-semibold leading-tight">Biblioteca AI</h3>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                        <p className="text-xs text-indigo-100 dark:text-indigo-200">Online</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0"> {/* flex-shrink-0 */}
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => setIsExpanded(!isExpanded)}
                           className="h-8 w-8 text-indigo-100 hover:bg-indigo-500/80 hover:text-white rounded-full dark:hover:bg-indigo-600/80"
                           aria-label={isExpanded ? "Restaurar tamanho do chat" : "Maximizar chat"}
                         >
                           {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                         </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-gray-800 text-white border-gray-700">
                        <p>{isExpanded ? "Restaurar" : "Maximizar"}</p>
                      </TooltipContent>
                    </Tooltip>
                     <Tooltip>
                       <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="h-8 w-8 text-indigo-100 hover:bg-red-500/80 hover:text-white rounded-full dark:hover:bg-red-600/80"
                            aria-label="Fechar chat"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                       </TooltipTrigger>
                       <TooltipContent side="bottom" className="bg-gray-800 text-white border-gray-700">
                         <p>Fechar</p>
                       </TooltipContent>
                     </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>

              {/* ================================================== */}
              {/* Wrapper Flexível para a Área de Conteúdo (A CORREÇÃO) */}
              {/* ================================================== */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {/* Área de Conteúdo Rolável */}
                <CardContent
                  className={cn(
                    "h-full overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800", // h-full é importante aqui
                    "scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800" // Estilização opcional da barra de rolagem
                  )}
                >
                  {messages.length === 0 ? (
                    // Estado Vazio
                    <div className="flex h-full flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-8">
                       <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                          <Bot className="mb-4 h-16 w-16 text-indigo-300 dark:text-indigo-500" />
                       </motion.div>
                       <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Bem-vindo à Biblioteca AI!</h3>
                       <p className="mt-1.5 max-w-xs text-sm px-4">
                         Posso ajudar a buscar livros, verificar empréstimos ou adicionar novos títulos. O que você gostaria de fazer?
                       </p>
                       <div className="mt-6 flex flex-wrap justify-center gap-2 px-2">
                         {quickSuggestions.map((suggestion, index) => (
                           <motion.div key={index} initial={{ opacity:0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }}>
                               <Badge
                                 variant="outline"
                                 className="cursor-pointer bg-white dark:bg-gray-700 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors flex items-center px-3 py-1.5 border-indigo-200 text-indigo-700 dark:text-indigo-300 shadow-sm rounded-full text-xs"
                                 onClick={() => handleQuickSuggestion(suggestion)}
                               >
                                 {suggestion.icon}
                                 <span className="ml-1.5">{suggestion.text}</span>
                               </Badge>
                           </motion.div>
                         ))}
                       </div>
                    </div>
                  ) : (
                    // Lista de Mensagens
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className={cn(
                            "flex w-full items-start gap-2.5",
                            message.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                           {/* Avatar do Bot */}
                          {message.role === "assistant" && (
                             <Avatar className="h-7 w-7 flex-shrink-0 bg-indigo-100 dark:bg-gray-700 order-1 shadow-sm">
                               <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                             </Avatar>
                          )}
                          {/* Caixa da Mensagem */}
                          <div
                            className={cn(
                              "rounded-lg px-3.5 py-2.5 shadow-sm text-sm leading-relaxed border",
                              message.role === "user"
                                ? "bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 text-white border-transparent rounded-br-none order-2"
                                : message.isError
                                  ? "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-500/50 dark:text-red-300 rounded-bl-none order-1"
                                  : "bg-white border-gray-200 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-bl-none order-1",
                              isMobile ? "max-w-[85%]" : "max-w-[75%]"
                            )}
                          >
                            {message.isLoading ? (
                              <div className="flex items-center space-x-1.5 py-1 min-w-[50px]">
                                  <div className="h-1.5 w-1.5 bg-indigo-400 dark:bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="h-1.5 w-1.5 bg-indigo-400 dark:bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="h-1.5 w-1.5 bg-indigo-400 dark:bg-indigo-300 rounded-full animate-bounce"></div>
                              </div>
                            ) : message.content ? (
                              <div
                                className="prose prose-sm max-w-none prose-p:my-1 prose-code:before:content-none prose-code:after:content-none prose-code:px-1 prose-code:py-0.5 prose-code:bg-gray-100 dark:prose-code:bg-gray-600 prose-code:rounded prose-strong:text-inherit dark:prose-invert dark:prose-p:text-gray-200 dark:prose-strong:text-white dark:prose-em:text-gray-300"
                                dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                              />
                            ) : null}
                          </div>
                           {/* Avatar do Usuário */}
                           {message.role === "user" && (
                              <Avatar className="h-7 w-7 flex-shrink-0 flex items-center justify-center bg-indigo-500 dark:bg-indigo-600 order-1 shadow-sm">
                                 <User className="h-4 w-4 text-white" />
                              </Avatar>
                           )}
                        </motion.div>
                      ))}
                      {/* Elemento para garantir scroll até o fim */}
                      <div ref={messagesEndRef} className="h-1" />
                    </div>
                  )}
                </CardContent>
              </div> {/* <<< Fim do Wrapper adicionado */}
              {/* ================================================== */}

              {/* Footer Fixo */}
              <CardFooter className="border-t bg-gray-100/50 dark:bg-gray-800/50 dark:border-gray-700/80 p-3 flex-col gap-3 flex-shrink-0"> {/* flex-shrink-0 */}
                {/* Sugestões rápidas */}
                {messages.length > 0 && !isBotLoading && (
                  <div className="w-full flex flex-wrap gap-1.5 justify-center md:justify-start px-1 pb-1">
                    <TooltipProvider delayDuration={100}>
                      {quickSuggestions.map((suggestion, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs border-indigo-200 bg-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center shadow-sm whitespace-nowrap"
                              onClick={() => handleQuickSuggestion(suggestion)}
                            >
                              {suggestion.icon}
                              <span className="ml-1">{suggestion.text}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 text-white border-gray-700">
                            <p>Usar: &quot;{suggestion.action}&quot;</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                )}
                {/* Formulário de Input */}
                <form onSubmit={handleSubmit} className="flex w-full items-end gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isBotLoading ? "Aguardando resposta..." : "Digite sua mensagem..."}
                    className="min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isBotLoading}
                    rows={1}
                    aria-label="Campo de mensagem"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isBotLoading || !input.trim()}
                    className="h-10 w-10 shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
                    aria-label="Enviar mensagem"
                  >
                    {isBotLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>
                 <p className="text-xs text-gray-400 dark:text-gray-500 text-center w-full mt-1.5 px-2">
                     Shift+Enter para nova linha.
                 </p>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opcional: Estilização da barra de rolagem (requer tailwindcss-scrollbar) */}
      {/* Instale: npm install -D tailwindcss-scrollbar */}
      {/* Adicione no tailwind.config.js: plugins: [require('tailwindcss-scrollbar'),], */}
    </>
  );
}