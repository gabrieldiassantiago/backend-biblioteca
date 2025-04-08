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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setIsModalOpen(true)
  }, [])

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
    const typingSpeed = 5
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
    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: input.trim(), timestamp: new Date() }
    const assistantPlaceholder: Message = { id: `bot-placeholder-${Date.now()}`, role: "assistant", content: "", isLoading: true, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage, assistantPlaceholder])
    setInput("")
    try {
      const response = await fetch("/api/library-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, userMessage] }) })
      if (!response.ok) throw new Error("Erro na API")
      const data = await response.json()
      const assistantResponse = data.content || "Desculpe, não consegui processar isso."
      setMessages(prev => prev.map(msg => msg.id === assistantPlaceholder.id ? { ...msg, content: "", isLoading: true } : msg) as Message[])
      typeMessage(assistantResponse, assistantPlaceholder.id)
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      const errorMessage = "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente."
      setMessages(prev => prev.map(msg => msg.id === assistantPlaceholder.id ? { ...msg, content: "", isLoading: true } : msg) as Message[])
      typeMessage(errorMessage, assistantPlaceholder.id)
    }
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
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono text-xs">$1</code>')
      .replace(/\n/g, '<br>')
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="flex flex-col h-[724px] w-full bg-white shadow-sm rounded-lg border border-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 rounded-t-lg">
        <h1 className="text-base sm:text-lg font-medium text-gray-800">Chat da Biblioteca</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">Administrador da biblioteca</span>
          <button onClick={handleNewChat} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-xs font-medium" title="Novo chat">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Novo chat</span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4">
            <Bot className="h-12 w-12 text-gray-300 mb-6" />
            <h3 className="text-xl sm:text-2xl font-medium text-gray-800 mb-2">Olá, seja bem-vindo</h3>
            <p className="text-sm text-gray-500 mb-8 text-center max-w-md">Como posso ajudar você hoje com a gestão da biblioteca?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
              {["Listar todos os livros disponíveis", "Como funciona o sistema de empréstimos?", "Quais as melhores práticas para gerenciar a biblioteca?"].map((suggestion) => (
                <button key={suggestion} onClick={() => handleSuggestionClick(suggestion)} className="px-4 py-3 border border-gray-200 rounded-lg text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message, index) => (
              <div key={message.id} className={`px-4 sm:px-8 py-6 ${message.role === "assistant" ? "bg-gray-50" : "bg-white"} ${index !== 0 && message.role !== messages[index - 1].role ? "border-t border-gray-100" : ""}`}>
                <div className="max-w-3xl mx-auto flex items-start gap-4">
                  {message.role === "assistant" ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 ${message.role === "assistant" ? "text-gray-700" : "text-gray-800"}`}>
                    {message.isLoading && message.content === "" ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px] bg-gray-200" />
                        <Skeleton className="h-4 w-[250px] bg-gray-200" />
                        <Skeleton className="h-4 w-[180px] bg-gray-200" />
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer className="px-4 sm:px-6 py-4 bg-white border-t border-gray-100 rounded-b-lg">
        <div className="max-w-3xl mx-auto relative">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Plus className="h-5 w-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 min-h-[40px] max-h-[120px] resize-none py-2 px-2 bg-transparent text-gray-800 text-sm focus:outline-none"
              disabled={isBotLoading}
            />
            <button className="p-2 text-gray-400 hover:text-gray-600 hidden sm:block">
              <Mic className="h-5 w-5" />
            </button>
            <button onClick={handleSubmit} disabled={isBotLoading || !input.trim()} className={`p-2 mx-1 rounded-md ${input.trim() && !isBotLoading ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-100 text-gray-400"} transition-colors`}>
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2 px-2">A IA da Biblioteca está em fase experimental. Use-a com cuidado.</p>
        </div>
      </footer>

      {/* Modal de Alerta Estilizado */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 transform transition-all duration-300 scale-100 hover:scale-[1.01]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-600 text-2xl">!</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Aviso Importante</h2>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              O Chat da Biblioteca está em fase de teste. Algumas funcionalidades podem apresentar instabilidade. Se encontrar algum problema, por favor, entre em contato comigo pelo e-mail:{" "}
              <a
                href="mailto:gabrieldiassantiago@hotmail.com"
                className="text-blue-500 hover:text-blue-600 underline font-medium"
              >
                gabrieldiassantiago@hotmail.com
              </a>
            </p>
            <button
              onClick={closeModal}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-medium"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}