'use client'
import { useState, useRef, useEffect } from "react"
import { Send, Plus, Mic, Bot, User, RotateCcw, Compass, Code, DraftingCompass, Lightbulb } from "lucide-react"
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
      const response = await fetch("/api/library-chat", 
        { method: "POST", 
          headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ messages: [...messages, userMessage] }) })
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
    <div className="relative overflow-hiden flex flex-col  w-full h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 text-sm sm:text-base font-light text-gray-600 border-b border-gray-100">
        <p className="text-gray-800 font-medium">Chat da Biblioteca</p>
        <div className="flex items-center gap-2 sm:gap-3">
         
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-xs sm:text-sm font-medium"
            title="Novo chat"
          >
            <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Novo chat
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-4xl flex-1 ">
        {messages.length === 0 ? (
          <div className="no-scrollbar mx-auto overflow-y-auto px-4 sm:px-6 pb-20 h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)]">
            <div className="my-8 sm:my-12 p-4 text-center">
              <p className="text-3xl sm:text-4xl md:text-5xl font-medium text-gray-800">
                <span className="bg-gradient-to-br from-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
                  Olá, bem vindo ao chat da biblioteca!
                </span>
                <span className="block mt-2 text-xl sm:text-2xl">Como posso ajudar com a gestão da biblioteca?</span>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 sm:gap-4 p-4">
              {[
                { label: "Listar todos os livros disponíveis", Icon: Compass },
                { label: "Explicar o sistema de empréstimos", Icon: Code },
                { label: "Melhores práticas para gerenciar a biblioteca", Icon: DraftingCompass },
                { label: "Sugestões para eventos na biblioteca", Icon: Lightbulb },
              ].map(({ label, Icon }, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(label)}
                  className="relative h-40 sm:h-48 cursor-pointer rounded-xl bg-gray-100 p-3 sm:p-4 duration-300 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
                >
                  <p className="text-xs sm:text-sm text-left">{label}</p>
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 rounded-full bg-white p-1.5 sm:p-2">
                    <Icon size={16}  />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-scrollbar overflow-y-auto px-4 sm:px-6 pb-20 h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)]">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`my-6 sm:my-8 flex items-start gap-3 sm:gap-5 ${
                  message.role === "assistant" ? "bg-gray-50" : "bg-white"
                } ${index !== 0 && message.role !== messages[index - 1].role ? "border-t border-gray-100" : ""}`}
              >
                <div className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-gray-100">
                  {message.role === "assistant" ? (
                    <Bot className="min-w-4 text-gray-600" size={14}  />
                  ) : (
                    <User className="min-w-4 text-gray-600" size={14} />
                  )}
                </div>
                <div className="flex-1">
                  {message.isLoading && message.content === "" ? (
                    <div className="flex w-full flex-col gap-2">
                      <Skeleton className="h-4 sm:h-5 w-8/12 bg-gray-200" />
                      <Skeleton className="h-4 sm:h-5 w-10/12 bg-gray-200" />
                      <Skeleton className="h-4 sm:h-5 w-6/12 bg-gray-200" />
                    </div>
                  ) : (
                    <div
                      className="prose prose-xs sm:prose-sm max-w-none text-gray-700 leading-relaxed font-light"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
        
      </div>

     {/* Input Area */}
<div className=" bottom-0 m-auto flex justify-center items-center left-0 right-0 mx-auto max-w-5xl px-2 sm:px-4 pt-3 pb-4 sm:pt-4 sm:pb-6 backdrop-blur-sm bg-white/80">
  <div className="flex justify-center mx-auto w-full max-w-5xl">
    <div className="w-screen m-auto max-w-6xl">
    <div className="flex items-center justify-center gap-2 sm:gap-4 rounded-3xl sm:rounded-full bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
    <button className="text-gray-600 hover:text-gray-800">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <textarea
  ref={textareaRef}
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Digite sua mensagem..."
  className="flex-1 mx-auto  flex h-[200vh] resize-none bg-transparent text-gray-800 text-xs sm:text-sm outline-none"
  disabled={isBotLoading}
/>

        <div className="flex items-center gap-2 sm:gap-4 text-gray-600">
          <button className="hover:text-gray-800">
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          {isBotLoading ? (
            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="hover:text-gray-800"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
      <p className="mx-auto mt-2 sm:mt-3 text-center text-xs sm:text-sm font-light text-gray-600">
        A IA da Biblioteca está em fase experimental. Use-a com cuidado.
      </p>
    </div>
  </div>
</div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md mx-4 shadow-2xl border border-gray-200 transform transition-all duration-300 scale-100 hover:scale-[1.01]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-600 text-lg sm:text-2xl">!</span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Aviso Importante</h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
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
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-medium text-sm sm:text-base"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}