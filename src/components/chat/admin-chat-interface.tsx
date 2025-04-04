'use client'
import { useState, useRef, useEffect } from "react"
import { Send, Plus, Mic, Bot, User, RotateCcw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isLoading?: boolean
  isError?: boolean
  timestamp?: Date
}

export function AdminChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, 100)
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const isBotLoading = messages.some(msg => msg.role === 'assistant' && msg.isLoading)

  const typeMessage = (fullContent: string, messageId: string) => {
    let currentIndex = 0
    const typingSpeed = 15

    const interval = setInterval(() => {
      if (currentIndex <= fullContent.length) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: fullContent.slice(0, currentIndex), isLoading: currentIndex < fullContent.length }
              : msg
          ) as Message[]
        )
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, typingSpeed)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isBotLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }
    const assistantPlaceholder: Message = {
      id: `bot-placeholder-${Date.now()}`,
      role: "assistant",
      content: "",
      isLoading: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage, assistantPlaceholder])

    try {
      const response = await fetch("/api/library-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) throw new Error("Erro na API")
      const data = await response.json()
      const assistantResponse = data.content || "Desculpe, não consegui processar isso."

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantPlaceholder.id
            ? { ...msg, content: "", isLoading: true }
            : msg
        ) as Message[]
      )
      typeMessage(assistantResponse, assistantPlaceholder.id)
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      const errorMessage = `Erro:  || "Ocorreu um erro"}`
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantPlaceholder.id
            ? { ...msg, content: "", isLoading: true }
            : msg
        ) as Message[]
      )
      typeMessage(errorMessage, assistantPlaceholder.id)
    }
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isBotLoading) handleSubmit(e)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => handleSubmit(new Event('submit') as unknown as React.FormEvent), 0)
  }

  const handleNewChat = () => {
    setMessages([])
    setInput("")
  }

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="flex flex-col h-[724px] w-full bg-white text-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 bg-white border-b border-gray-200">
        <h1 className="text-base sm:text-lg font-semibold text-gray-800">Chat da Biblioteca</h1>
        <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">Adminstrador da biblioteca</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Novo chat"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <span className="text-xs sm:text-sm text-gray-500">Criar novo chat</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot className="h-10 w-10 sm:h-12 sm:w-12 mb-4 text-gray-400" />
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Olá, seja bem vindo</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 text-center">Como posso ajudar você hoje?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 w-full max-w-md">
              <button
                onClick={() => handleSuggestionClick("Listar todos os livros disponíveis")}
                className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-full text-xs sm:text-sm text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
              >
                Listar todos os livros
              </button>
              <button
                onClick={() => handleSuggestionClick("Como funciona o sistema de empréstimos?")}
                className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-full text-xs sm:text-sm text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
              >
                Como funciona o sistema?
              </button>
              <button
                onClick={() => handleSuggestionClick("Quais as melhores práticas para gerenciar a biblioteca?")}
                className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-full text-xs sm:text-sm text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
              >
                Melhores práticas
              </button>
              
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-[90%] sm:max-w-6xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 sm:gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : message.isError
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.isLoading && message.content === "" ? (
                    <div className="space-y-2">
                      <Skeleton className="h-3 sm:h-4 w-[150px] sm:w-[200px] bg-gray-300" />
                      <Skeleton className="h-3 sm:h-4 w-[120px] sm:w-[150px] bg-gray-300" />
                      <Skeleton className="h-3 sm:h-4 w-[80px] sm:w-[100px] bg-gray-300" />
                    </div>
                  ) : (
                    <div
                      className="prose prose-xs sm:prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                    />
                  )}
                </div>
                {message.role === "user" && (
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer className="p-3 sm:p-6 bg-white border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-[90%] sm:max-w-3xl mx-auto">
          <button className="p-1 sm:p-2 text-gray-500 hover:text-gray-700">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1 min-h-[36px] container flex justify-center items-center sm:min-h-[40px] max-h-[100px] sm:max-h-[120px] resize-none rounded-full border border-gray-300 bg-white text-gray-800 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            disabled={isBotLoading}
          />
          <button className="p-1 sm:p-2 text-gray-500 hover:text-gray-700">
            <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={isBotLoading || !input.trim()}
            className="p-1 sm:p-2 bg-blue-500 text-white rounded-full disabled:opacity-40"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </footer>
    </div>
  )
}