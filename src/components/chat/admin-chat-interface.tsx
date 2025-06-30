"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, BookOpen, Users, Upload, Sparkles, AlertCircle, Search, Plus, BarChart3 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isLoading?: boolean
  isError?: boolean
  timestamp?: Date
  typing?: boolean
}

interface BookData {
  title: string
  author: string
  isbn?: string
  stock: number
  available: number
}

export function LibraryChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [processedFileData, setProcessedFileData] = useState<BookData[] | null>(null)
  const [modelUsed, setModelUsed] = useState<"gemini" | "openai" | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const isBotLoading = messages.some((msg) => msg.role === "assistant" && msg.isLoading)

  const typeMessage = (fullContent: string, messageId: string) => {
    let currentIndex = 0
    const typingSpeed = 5

    const interval = setInterval(() => {
      if (currentIndex <= fullContent.length) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: fullContent.slice(0, currentIndex),
                  isLoading: currentIndex < fullContent.length,
                  typing: currentIndex < fullContent.length,
                }
              : msg,
          ),
        )
        currentIndex += 2
      } else {
        clearInterval(interval)
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, isLoading: false, typing: false } : msg)),
        )
      }
    }, typingSpeed)
  }

  const sendMessage = async (messageContent: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    }

    const assistantPlaceholder: Message = {
      id: `bot-${Date.now()}`,
      role: "assistant",
      content: "",
      isLoading: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder])

    try {
      const messagesToSend = [...messages, userMessage]
        .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }))

      const startTime = Date.now()
      const response = await fetch("/api/library-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          bookDataForTool: processedFileData,
        }),
      })

      if (!response.ok) throw new Error("Erro na API de chat")

      const data = await response.json()
      const assistantResponse = data.content || "Desculpe, não consegui processar isso."

      // Determinar qual modelo foi usado com base no tempo de resposta
      const responseTime = Date.now() - startTime
      setModelUsed(responseTime < 5000 ? "gemini" : "openai")

      typeMessage(assistantResponse, assistantPlaceholder.id)

      if (processedFileData && messageContent.toLowerCase().includes("sim")) {
        setProcessedFileData(null)
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id
            ? { ...msg, content: "Ocorreu um erro ao processar sua solicitação.", isLoading: false, isError: true }
            : msg,
        ),
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isBotLoading || isUploading) return

    const currentInput = input.trim()
    setInput("")
    sendMessage(currentInput)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isBotLoading && !isUploading) handleSubmit(e)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleNewChat = () => {
    setMessages([])
    setInput("")
    setProcessedFileData(null)
    setIsUploading(false)
    setModelUsed(null)
  }

  const formatMessageContent = (content: string) => {
    if (content.startsWith("<div") || content.startsWith("<span") || content.startsWith("<a")) {
      return content
    }

    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, "<br>")
  }

  const formatTime = (date?: Date) => {
    if (!date) return ""
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const features = [
    {
      icon: BookOpen,
      title: "Gestão de Livros",
      description: "Adicione, liste e gerencie todo o acervo da biblioteca de forma inteligente",
      color: "bg-blue-50 text-blue-600",
      bgColor: "bg-blue-500",
      command: "Listar livros recentes",
    },
    {
      icon: Users,
      title: "Controle de Empréstimos",
      description: "Gerencie empréstimos, renovações e devoluções com facilidade",
      color: "bg-orange-50 text-orange-600",
      bgColor: "bg-orange-500",
      command: "Verificar empréstimos ativos",
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Gere relatórios detalhados e análises do uso da biblioteca",
      color: "bg-pink-50 text-pink-600",
      bgColor: "bg-pink-500",
      command: "Gerar relatório da biblioteca",
    },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Biblioteca AI</h1>
              <p className="text-sm text-gray-500">Assistente inteligente</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {modelUsed && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1 border-gray-300 text-xs">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {modelUsed === "gemini" ? "Gemini" : "GPT-4o"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modelo atual: {modelUsed === "gemini" ? "Google Gemini" : "OpenAI GPT-4o"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="gap-2 text-sm"
              disabled={isUploading || isBotLoading}
            >
              <Plus className="h-4 w-4" />
              Nova conversa
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {messages.length === 0 ? (
              /* Welcome Screen - Inspirado na imagem */
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center space-y-8">
                {/* Avatar Central */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* Welcome Message */}
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold text-gray-900">
                    Bem-vindo à Biblioteca AI!
                  </h1>
                  <p className="text-lg text-gray-600 max-w-md">
                    Aqui para ajudar com ideias, gestão e muito mais! O que você gostaria de fazer hoje?
                  </p>
                </div>

                {/* Search Input */}
                <div className="w-full max-w-2xl relative">
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                          processedFileData
                            ? `Confirmar adição de ${processedFileData.length} livros? (Digite 'sim')`
                            : "Pergunte algo..."
                        }
                        className="w-full resize-none bg-white border border-gray-200 rounded-2xl pl-12 pr-16 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg max-h-32"
                        disabled={isBotLoading || isUploading}
                        rows={1}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl hover:bg-gray-100"
                          disabled={isUploading || isBotLoading}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          type="submit"
                          disabled={!input.trim() || isBotLoading || isUploading}
                          className="h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-700 p-0"
                        >
                          {isBotLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
                  {features.map((feature, idx) => (
                    <Card
                      key={idx}
                      onClick={() => handleSuggestionClick(feature.command)}
                      className="group cursor-pointer border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white"
                    >
                      <CardContent className="p-6 text-center">
                        <div
                          className={`w-12 h-12 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200`}
                        >
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">{feature.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "assistant"
                          ? "bg-gradient-to-br from-blue-600 to-purple-600"
                          : "bg-gradient-to-br from-gray-700 to-gray-900"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Bot className="h-4 w-4 text-white" />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div
                        className={`inline-block max-w-full rounded-2xl px-4 py-3 ${
                          message.role === "assistant"
                            ? "bg-white shadow-sm border border-gray-100"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        }`}
                      >
                        {message.isLoading && !message.content ? (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">Pensando...</span>
                          </div>
                        ) : (
                          <div
                            className={`prose prose-sm max-w-none ${
                              message.role === "assistant" ? "text-gray-800" : "text-white prose-invert"
                            }`}
                            dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                          />
                        )}

                        {message.typing && (
                          <div className="flex items-center gap-1 mt-2">
                            <div
                              className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                        )}
                      </div>

                      <div className={`text-xs ${message.role === "assistant" ? "text-gray-400" : "text-gray-500"}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area - Only show when there are messages */}
      {messages.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    processedFileData
                      ? `Confirmar adição de ${processedFileData.length} livros? (Digite 'sim')`
                      : "Digite sua mensagem..."
                  }
                  className="w-full resize-none bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                  disabled={isBotLoading || isUploading}
                  rows={1}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-2xl border-gray-200 hover:bg-gray-50"
                disabled={isUploading || isBotLoading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>

              <Button
                type="submit"
                disabled={!input.trim() || isBotLoading || isUploading}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
              >
                {isBotLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            <input
              type="file"
              ref={fileInputRef}
              onChange={() => {}} // Implementar upload de arquivo
              accept=".xlsx,.xls"
              className="hidden"
              disabled={isUploading || isBotLoading}
            />

            <div className="flex items-center justify-center gap-2 mt-3">
              <p className="text-xs text-gray-500 text-center">
                Biblioteca AI pode cometer erros. Verifique informações importantes.
              </p>
              {modelUsed && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-gray-500 cursor-help">
                        <AlertCircle className="h-3 w-3" />
                        {modelUsed === "gemini" ? "Gemini" : "GPT-4o"}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Usando {modelUsed === "gemini" ? "Google Gemini" : "OpenAI GPT-4o"} como modelo de IA
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
