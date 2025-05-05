'use client';

import { useState, useRef, useEffect, FC } from 'react';
import { Send, Bot, User, RotateCcw, Compass, Code, DraftingCompass, Paperclip, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  isError?: boolean;
  timestamp?: Date;
  isProcessing?: boolean;
  fileInfo?: {
    name: string;
    valid: number;
    errors: number;
    details?: ValidationError[];
  };
  typing?: boolean;
}

interface BookData {
  title: string;
  author: string;
  isbn?: string;
  stock: number;
  available: number;
}

interface ValidationError {
  row: number;
  error: string;
}

// Configuração otimizada para a animação de digitação
const typeMessageWithAnimation = (
  fullContent: string,
  messageId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  let currentIndex = 0;
  
  // Velocidade de digitação adaptativa baseada no tamanho do conteúdo
  const getTypingSpeed = () => {
    const contentLength = fullContent.length;
    // Mais rápido para conteúdos longos
    if (contentLength > 500) return Math.random() * (30 - 15) + 15;
    // Velocidade média para conteúdos médios
    if (contentLength > 200) return Math.random() * (50 - 25) + 25;
    // Mais lento para conteúdos curtos (mais natural)
    return Math.random() * (70 - 30) + 30;
  };

  // Pular animação para conteúdo HTML ou muito longo
  if (fullContent.trim().startsWith('<') || fullContent.length > 1000) {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, content: fullContent, isLoading: false } : msg
      )
    );
    return;
  }

  const interval = setInterval(() => {
    // Incremento adaptativo - mais rápido para mensagens longas
    const increment = fullContent.length > 500 ? 3 : (fullContent.length > 200 ? 2 : 1);
    
    if (currentIndex <= fullContent.length) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                content: fullContent.slice(0, currentIndex),
                isLoading: currentIndex < fullContent.length,
                typing: true,
              }
            : msg
        )
      );
      currentIndex += increment;
    } else {
      clearInterval(interval);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isLoading: false, typing: false } : msg
        )
      );
    }
  }, getTypingSpeed());

  return () => clearInterval(interval);
};

// Componente de "pensando" otimizado com animação mais suave
export const Thinking: FC = () => (
  <div className="flex items-center gap-2">
    <div className="flex items-end gap-1">
      <span className="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.6s' }} />
      <span className="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }} />
      <span className="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.6s' }} />
    </div>
    <span className="text-sm text-gray-500">Pensando...</span>
  </div>
);

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse ${className}`}></div>
);

export function AdminChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processedFileData, setProcessedFileData] = useState<BookData[] | null>(null);
  const [currentFileContext, setCurrentFileContext] = useState<{
    name: string;
    valid: number;
    errors: number;
    details?: ValidationError[];
  } | null>(null);
  // Novo estado para controlar o timeout de "pensando"
  const [thinkingTimeout, setThinkingTimeout] = useState<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Limpar timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (thinkingTimeout) clearTimeout(thinkingTimeout);
    };
  }, [thinkingTimeout]);

  const isBotLoading = messages.some((msg) => msg.role === 'assistant' && msg.isLoading);

  // Função otimizada para exibir mensagens com animação de digitação
  const typeMessage = (fullContent: string, messageId: string) => {
    const isReportMessage =
      fullContent.includes('Relatório') &&
      (fullContent.includes('sucesso') || fullContent.includes('gerado'));
  
    const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
    const hasUrl = urlRegex.test(fullContent);
  
    // Tratamento especial para mensagens de relatório
    if (isReportMessage && hasUrl) {
      const reportUrl = fullContent.match(urlRegex)?.[0] || '';
      
      // Mostrar mensagem de "Gerando relatório..." com tempo reduzido
      const loadingContent = `
        <div class="p-4 rounded-lg border bg-blue-50 border-blue-200 shadow-sm w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto">
          <div class="flex items-start gap-2 mb-3">
            <div class="flex-shrink-0 mt-0.5">
              <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm text-blue-600 font-medium mb-1">Gerando Relatório...</p>
              <p class="text-sm text-gray-600">Aguarde enquanto preparamos seu relatório.</p>
            </div>
          </div>
        </div>
      `;
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: loadingContent, isLoading: true } : msg
        ) as Message[]
      );
      
      // Reduzido para 1.5 segundos
      setTimeout(() => {
        const finalContent = `
          <div class="p-4 rounded-lg border bg-green-50 border-green-200 shadow-sm w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto">
            <div class="flex items-start gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm text-green-600 font-medium mb-1">Relatório Gerado com Sucesso</p>
                <p class="text-sm text-gray-600">O relatório foi gerado e está pronto para download.</p>
              </div>
            </div>
            <div class="mt-3 flex items-center justify-between bg-white p-3 rounded border border-gray-100">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-sm text-gray-700 font-medium">Relatório da Biblioteca</span>
              </div>
              <a href="${reportUrl}" target="_blank" class="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Baixar</span>
              </a>
            </div>
          </div>
        `.trim();
        
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: finalContent, isLoading: false } : msg
          ) as Message[]
        );
      }, 1500);
      
      return;
    }
  
    if (fullContent.includes('Erro') && fullContent.includes('relatório')) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: 'Tentando gerar relatório...', isLoading: true } : msg
        ) as Message[]
      );
      setTimeout(() => {
        const errorContent = `
          <div class="p-4 rounded-lg border bg-red-50 border-red-200 shadow-sm w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto">
            <div class="flex items-start gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm text-red-600 font-medium mb-1">Falha ao Gerar Relatório</p>
                <p class="text-sm text-gray-600">${fullContent
                  .replace(/❌ (Erro ao gerar relatório|Erro ao preparar relatório|Erro ao verificar biblioteca): /, '')
                  .replace(/"/g, '"')}</p>
              </div>
            </div>
          </div>
        `;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: errorContent, isLoading: false } : msg
          ) as Message[]
        );
      }, 300);
      return;
    }
  
    // Animação de digitação padrão para outras mensagens
    typeMessageWithAnimation(fullContent, messageId, setMessages);
  };

  // Função otimizada para enviar mensagens
  const sendMessage = async (messageContent: string, messageList: Message[]) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
  
    const messagesToSend = [...messageList, userMessage]
      .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));
  
    // Placeholder do assistente com animação de "pensando"
    const assistantPlaceholder: Message = {
      id: `bot-placeholder-${Date.now()}`,
      role: 'assistant',
      content: `<div class="flex items-center gap-2">
        <div class="flex items-end gap-1">
          <span class="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0s; animation-duration: 0.6s"></span>
          <span class="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s; animation-duration: 0.6s"></span>
          <span class="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.4s; animation-duration: 0.6s"></span>
        </div>
        <span class="text-sm text-gray-500">Pensando...</span>
      </div>`,
      isLoading: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
  
    try {
      // Configurar um timeout para garantir que a animação de "pensando" seja mostrada por pelo menos 500ms
      const minThinkingTime = 500; // 0.5 segundos
      const thinkingStart = Date.now();
      
      // Fazer a requisição à API com timeout reduzido
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout
      
      const response = await fetch('/api/library-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesToSend }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Erro na API de chat');
  
      const data = await response.json();
      const assistantResponse = data.content || 'Desculpe, não consegui processar isso.';
  
      // Calcular quanto tempo já passou desde o início da animação de "pensando"
      const elapsedTime = Date.now() - thinkingStart;
      const remainingTime = Math.max(0, minThinkingTime - elapsedTime);
      
      // Garantir que a animação de "pensando" seja mostrada por pelo menos o tempo mínimo
      if (remainingTime > 0) {
        const timeout = setTimeout(() => {
          // Atualizar a mensagem para conteúdo vazio antes de iniciar a digitação
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholder.id ? { ...msg, content: '', isLoading: true } : msg
            ) as Message[]
          );
          typeMessage(assistantResponse, assistantPlaceholder.id);
        }, remainingTime);
        
        setThinkingTimeout(timeout);
      } else {
        // Se já passou tempo suficiente, iniciar a digitação imediatamente
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholder.id ? { ...msg, content: '', isLoading: true } : msg
          ) as Message[]
        );
        typeMessage(assistantResponse, assistantPlaceholder.id);
      }
  
      if (processedFileData && messageContent.toLowerCase().includes('confirmado')) {
        setProcessedFileData(null);
        setCurrentFileContext(null);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage = error instanceof Error && error.name === 'AbortError'
        ? 'A solicitação demorou muito tempo. Por favor, tente novamente com uma pergunta mais simples.'
        : 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.';
        
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id
            ? { ...msg, content: errorMessage, isLoading: false, isError: true }
            : msg
        ) as Message[]
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBotLoading || isUploading) return;

    const currentInput = input.trim();
    setInput('');

    const confirmationKeywords = ['sim', 'confirmar', 'adicionar', 'prosseguir', 'pode adicionar', 'ok', 'yes', 'add'];
    if (processedFileData && currentFileContext && confirmationKeywords.some((keyword) => currentInput.toLowerCase().includes(keyword))) {
      const confirmationMessage: Message = {
        id: `user-confirm-${Date.now()}`,
        role: 'user',
        content: `Confirmado: Adicionar os ${currentFileContext.valid} livros do arquivo ${currentFileContext.name}.`,
        timestamp: new Date(),
      };

      const messagesToSend = [...messages, confirmationMessage]
        .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const assistantPlaceholder: Message = {
        id: `bot-placeholder-${Date.now()}`,
        role: 'assistant',
        content: '',
        isLoading: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmationMessage, assistantPlaceholder]);

      try {
        const response = await fetch('/api/library-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesToSend,
            bookDataForTool: processedFileData,
          }),
        });

        if (!response.ok) throw new Error('Erro na API de chat ao adicionar livros');

        const data = await response.json();
        const assistantResponse = data.content || 'Desculpe, não consegui processar a adição dos livros.';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholder.id ? { ...msg, content: '', isLoading: true } : msg
          ) as Message[]
        );
        typeMessage(assistantResponse, assistantPlaceholder.id);
      } catch (error) {
        console.error('Erro ao confirmar adição de livros:', error);
        const errorMsgContent = 'Ocorreu um erro ao tentar adicionar os livros do arquivo. Tente novamente.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholder.id
              ? { ...msg, content: errorMsgContent, isLoading: false, isError: true }
              : msg
          ) as Message[]
        );
      } finally {
        setProcessedFileData(null);
        setCurrentFileContext(null);
      }
    } else {
      sendMessage(currentInput, messages);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isBotLoading && !isUploading) handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion, messages);
  };

  const handleNewChat = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.classList.add('opacity-50');
      setTimeout(() => {
        setMessages([]);
        setInput('');
        setProcessedFileData(null);
        setCurrentFileContext(null);
        setIsUploading(false);
        if (chatContainerRef.current) {
          chatContainerRef.current.classList.remove('opacity-50');
        }
      }, 300);
    } else {
      setMessages([]);
      setInput('');
      setProcessedFileData(null);
      setCurrentFileContext(null);
      setIsUploading(false);
    }
  };

  const formatMessageContent = (content: string, message?: Message) => {
    const trimmed = content.trimStart();

    // Remove fence \`\`\`html ... \`\`\`
    const fenceMatch = trimmed.match(/^\`\`\`html\s*([\s\S]*?)\s*\`\`\`$/i);
    if (fenceMatch) return fenceMatch[1].trim();

    // Remove linha solta "html" no começo
    const [first, ...rest] = trimmed.split('\n');
    if (/^`?html`?$/i.test(first.trim())) return rest.join('\n').trim();

    // Se já é HTML direto
    if (/^<\s*(div|table|span|a)\b/i.test(trimmed)) return trimmed;
    
    if (message?.isProcessing) {
      return `
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processando o arquivo <strong>${message.fileInfo?.name || '...'}</strong>
        </div>`;
    }

    if (message?.fileInfo && !message.isProcessing) {
      const { name, valid, errors, details } = message.fileInfo;
      let errorDetailsHtml = '';
      if (errors > 0 && details && details.length > 0) {
        errorDetailsHtml = `
          <details class="mt-3 text-xs">
            <summary class="cursor-pointer text-red-600 hover:text-red-800 font-medium">Ver ${errors > 1 ? `${errors} erros` : '1 erro'}</summary>
            <ul class="list-disc list-inside mt-2 text-red-700 bg-red-50 p-3 rounded border border-red-100 max-h-40 overflow-y-auto">
              ${details.map((err) => `<li class="break-words text-sm">Linha ${err.row}: ${err.error}</li>`).join('')}
            </ul>
          </details>`;
      }

      const hasValidBooks = valid > 0;
      const iconHtml = hasValidBooks
        ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>`;

      const titleColor = hasValidBooks ? 'text-green-700' : 'text-red-700';
      const bgColor = hasValidBooks ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

      return `
        <div class="p-4 rounded-lg border ${bgColor} shadow-sm w-full max-w-2xl mx-auto">
          <div class="flex items-center mb-3">
            ${iconHtml}
            <span class="font-medium ${titleColor}">Arquivo ${name} processado</span>
          </div>
          <p class="text-sm text-gray-700 mb-2">
            ${valid} ${valid === 1 ? 'livro válido encontrado' : 'livros válidos encontrados'}.
            ${errors} ${errors === 1 ? 'erro' : 'erros'} na validação.
          </p>
          ${errorDetailsHtml}
          ${
            hasValidBooks
              ? `<p class="mt-3 text-sm text-gray-800"><strong>Posso adicionar os ${valid} livros válidos à biblioteca?</strong> Responda com "sim" ou "confirmar".</p>`
              : '<p class="mt-3 text-sm text-red-700">Nenhum livro válido para adicionar. Verifique os erros e tente novamente com um arquivo corrigido.</p>'
          }
        </div>
      `;
    }

    if (message?.isError && !message.isProcessing && !message.fileInfo) {
      return content;
    }

    if (content.startsWith('<div') || content.startsWith('<span') || content.startsWith('<a')) {
      return content;
    }

    const urlRegexCheck = /(https?:\/\/[^\s]+)/g;
    const contentWithLinks = content.replace(urlRegexCheck, (url) => {
      if (url.toLowerCase().endsWith('.pdf')) {
        return `<a href="${url}" target="_blank" class="text-blue-500 hover:text-blue-600 underline">Baixar PDF</a>`;
      }
      return `<a href="${url}" target="_blank" class="text-blue-500 hover:text-blue-600 underline">${url}</a>`;
    });
    return contentWithLinks
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploading(true);
    setProcessedFileData(null);
    setCurrentFileContext(null);

    const processingMessageId = `proc-${Date.now()}`;
    const processingMessage: Message = {
      id: processingMessageId,
      role: 'assistant',
      content: '',
      isProcessing: true,
      fileInfo: { name: file.name, valid: 0, errors: 0 },
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, processingMessage]);

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Usar AbortController para limitar o tempo de processamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout
      
      const fetchPromise = fetch('/api/process-excel', { 
        method: 'POST', 
        body: formData,
        signal: controller.signal 
      });
      
      // Reduzido para 2 segundos para melhor UX
      const minDelayPromise = new Promise((resolve) => setTimeout(resolve, 2000));
      const [response] = await Promise.all([fetchPromise, minDelayPromise]);
      
      clearTimeout(timeoutId);
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro desconhecido ao processar o arquivo.');
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === processingMessageId
            ? {
                ...msg,
                isProcessing: false,
                isError: false,
                fileInfo: {
                  name: result.fileName,
                  valid: result.validBooksCount,
                  errors: result.errorsCount,
                  details: result.validationErrors,
                },
                content: `[Arquivo ${result.fileName} processado: ${result.validBooksCount} válidos, ${result.errorsCount} erros]`,
              }
            : msg
        )
      );

      if (result.success && result.validBooksCount > 0) {
        setProcessedFileData(result.validBooks);
        setCurrentFileContext({
          name: result.fileName,
          valid: result.validBooksCount,
          errors: result.errorsCount,
          details: result.validationErrors,
        });
      } else {
        setProcessedFileData(null);
        setCurrentFileContext(null);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      const errorMessage = error instanceof Error && error.name === 'AbortError'
        ? 'O processamento do arquivo demorou muito tempo. Tente um arquivo menor ou com menos dados.'
        : error instanceof Error ? error.message : 'Erro desconhecido.';
        
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === processingMessageId
            ? {
                ...msg,
                isProcessing: false,
                isError: true,
                content: `❌ Erro ao processar ${file.name}: ${errorMessage}`,
                fileInfo: undefined,
              }
            : msg
        )
      );
      setProcessedFileData(null);
      setCurrentFileContext(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Indicador de digitação otimizado
  const MessageTypingIndicator = () => (
    <div className="flex items-center gap-1 h-4 mt-1">
      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex-none rounded-b-2xl backdrop-blur-md bg-white/80 sticky top-0 z-20 px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 font-semibold text-lg lg:text-xl">Chat da Biblioteca</h1>
              <p className="text-gray-500 text-sm hidden sm:block">Assistente virtual de gestão de biblioteca</p>
            </div>
          </div>
                
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="gap-1.5 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              title="Novo chat"
              disabled={isUploading || isBotLoading}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Novo chat</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden relative">
        <div ref={chatContainerRef} className="absolute inset-0 overflow-y-auto scroll-smooth">
          <div className="mx-auto w-full max-w-5xl">
            {messages.length === 0 ? (
              <div className="px-4 sm:px-6 py-8">
                <div className="my-8 sm:my-12 p-6 text-center">
                  <div className="animate-fadeIn">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                      <span className="bg-clip-text text-transparent bg-gray-800">
                        Olá! 👋 Como posso ajudar?
                      </span>
                    </h2>
                    <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
                      Posso adicionar livros, gerenciar empréstimos e mais.
                    </p>
                    
                    <Button
                      onClick={handleUploadClick}
                      disabled={isUploading}
                      size="lg"
                      className={`gap-2 px-8 py-6 rounded-full transition-all duration-300 text-base ${
                        isUploading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-500'
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processando...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-5 h-5" />
                          Adicionar Livros via Excel
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {[
                    {
                      label: 'Listar livros recentes',
                      Icon: Compass,
                      color: 'from-blue-500 to-cyan-500',
                      description: 'Veja os últimos livros adicionados ao sistema',
                    },
                    {
                      label: 'Como renovar um empréstimo?',
                      Icon: Code,
                      color: 'from-purple-500 to-pink-500',
                      description: 'Aprenda o processo de renovação de empréstimos',
                    },
                    {
                      label: 'Gerar relatório de empréstimos',
                      Icon: DraftingCompass,
                      color: 'from-amber-500 to-orange-500',
                      description: 'Crie um relatório com estatísticas da biblioteca',
                    },
                  ].map(({ label, Icon, color, description }, idx) => (
                    <Card
                      key={idx}
                      onClick={() => handleSuggestionClick(label)}
                      className={`group relative h-auto border-gray-100 hover:border-blue-200 transition-all duration-300 cursor-pointer hover:shadow-md ${
                        isUploading || isBotLoading ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <CardContent className="p-6">
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`}
                        ></div>
                        <h3 className="text-lg font-medium mb-2 text-gray-800">{label}</h3>
                        <p className="text-sm text-gray-600 mb-4">{description}</p>
                        <div
                          className={`inline-flex rounded-full bg-gradient-to-br ${color} p-2.5 shadow-md transform transition-transform duration-300 group-hover:scale-110`}
                        >
                          <Icon size={18} className="text-white" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-6 space-y-8">
                {messages.map((message) => (
                  <div key={message.id} className="animate-fadeIn">
                    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`flex ${
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        } max-w-full sm:max-w-[85%] items-start gap-3`}
                      >
                        <div
                          className={`grid h-9 w-9 place-items-center rounded-full flex-shrink-0 ${
                            message.role === 'assistant'
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-md'
                              : 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-md'
                          }`}
                        >
                          {message.role === 'assistant' ? (
                            <Bot className="text-white" size={16} />
                          ) : (
                            <User className="text-white" size={16} />
                          )}
                        </div>
                        
                        <div
                          className={`${
                            message.role === 'assistant'
                              ? 'bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-none shadow-md'
                          } px-5 py-3.5 transition-all duration-300`}
                        >
                          {message.isLoading && !message.isProcessing && !message.fileInfo && !message.content.startsWith('<div') ? (
                            <div className="flex w-full flex-col gap-3">
                              <Skeleton className="h-5 w-16 bg-gray-200 rounded" />
                              <Skeleton className="h-5 w-24 bg-gray-200 rounded" />
                              <Skeleton className="h-5 w-20 bg-gray-200 rounded" />
                            </div>
                          ) : (
                            <>
                              <div
                                className={`prose prose-sm max-w-none ${
                                  message.role === 'assistant' ? 'text-gray-700' : 'text-white prose-invert'
                                } leading-relaxed font-light`}
                                dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content, message) }}
                              />
                              {message.typing && message.role === 'assistant' && <MessageTypingIndicator />}
                              {message.isProcessing || message.fileInfo ? null : (
                                <div
                                  className={`text-xs mt-2 text-right ${
                                    message.role === 'assistant' ? 'text-gray-400' : 'text-blue-100'
                                  }`}
                                >
                                  {formatTime(message.timestamp)}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="shadow-md px-4 py-4">
        <div className="mx-auto max-w-5xl">
          <div className="relative flex items-end gap-3 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <button
              onClick={handleUploadClick}
              disabled={isUploading || isBotLoading}
              className={`p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isUploading ? 'animate-pulse' : ''
              }`}
              title="Carregar arquivo Excel (.xlsx, .xls)"
            >
              {isUploading ? <UploadCloud className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
              disabled={isUploading || isBotLoading}
            />
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isUploading
                    ? 'Aguardando processamento do arquivo...'
                    : processedFileData
                    ? `Confirmar adição de ${currentFileContext?.valid} livros? (Digite 'sim')`
                    : 'Digite sua mensagem...'
                }
                className="block w-full resize-none bg-transparent text-gray-800 text-sm placeholder:text-gray-400 outline-none max-h-32 py-1.5 leading-tight"
                disabled={isBotLoading || isUploading}
                rows={1}
              />
            </div>
            <div className="flex items-center">
              {isBotLoading ? (
                <div className="w-10 h-10 grid place-items-center">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isUploading}
                  variant={input.trim() && !isUploading ? 'default' : 'outline'}
                  size="icon"
                  className={`rounded-full w-10 h-10 ${
                    input.trim() && !isUploading
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg transition-all duration-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-xs font-light text-gray-500">
            Biblioteca AI 📚 - {new Date().getFullYear()} - Lembre-se de verificar os dados antes de confirmar.
          </p>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50 animate-fadeIn">
          <Card className="w-full max-w-md mx-4 shadow-xl border-0 animate-scaleIn">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shadow-inner">
                  <span className="text-amber-600 text-xl font-medium">!</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Aviso Importante</h2>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                O Chat da Biblioteca está em fase de teste. Algumas funcionalidades, como o upload de arquivos, podem apresentar instabilidade. Se encontrar algum problema, por favor, entre em contato com o desenvolvedor.
              </p>
              <Button
                onClick={closeModal}
                className="w-full py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-base"
              >
                Entendido
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
