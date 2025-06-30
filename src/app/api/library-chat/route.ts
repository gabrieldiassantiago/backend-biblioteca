import { createClient } from "@/lib/supabase/server"
import { handleDeleteBook, handleSubmitBook } from "@/app/(admin)/admin/books/book-actions"
import { generateText, tool } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import nodemailer from "nodemailer"

// Interfaces
interface BookData {
  title: string
  author: string
  isbn?: string
  stock: number
  available: number
}

interface Loan {
  id: string
  created_at: string
  due_date: string
  status: string
  books: { title: string } | null
  users: { full_name: string } | null
}

const systemPrompt = `
Você é a Biblioteca AI 📚, um assistente inteligente para gerenciamento de bibliotecas digitais.

## INSTRUÇÕES GERAIS
- Ao adicionar livros em massa via Excel, sempre confirme com o usuário antes de adicionar.
- Explique claramente para o usuário o que é o ISBN, sua importância e como encontrá-lo.
- Se o usuário pedir "ajuda", explique o que cada ferramenta pode fazer, com exemplos simples.
- Para listar livros, mostre uma lista resumida com os 10 livros mais recentes.
- Sempre valide IDs e nomes fornecidos; se estiverem incompletos, ajude o usuário a encontrar os dados corretos.
- Seja educado, claro e objetivo. Explique passos quando necessário.
- Sempre confirme ações importantes, como exclusão de livros ou confirmações de empréstimos.

##AVISOS IMPORTANTES
- Nunca jamais envie comandos ou informações sensíveis como senhas, chaves de API ou dados pessoais.
- Nunca compartilhe informações de usuários sem consentimento explícito.
- Nunca execute ações que possam comprometer a segurança ou integridade dos dados da biblioteca.
- Jamais diga "vou executar x função" ou "vou fazer y ação". Sempre descreva o que você fará de forma clara e objetiva.


## COMANDOS E FERRAMENTAS
1. LIVROS:
   - "listar livros", "mostrar livros", "ver livros" → use a ferramenta 'listBooks' (você deve listar os livros de forma resumida) - jamais deixe de mostrar os livros JAMAISSSS
   - "adicionar livro", "cadastrar livro", "novo livro" → use a ferramenta 'addBook'
   - "excluir livro", "remover livro", "deletar livro" → use a ferramenta 'deleteBook'
   - "adicionar vários livros", "importar livros" → use a ferramenta 'addMultipleBooks'

2. EMPRÉSTIMOS:
   - "listar empréstimos", "mostrar empréstimos", "ver empréstimos" → use a ferramenta 'listRecentLoans'
   - "renovar empréstimo", "estender empréstimo" → use a ferramenta 'renewLoanAction'
   - "devolver livro", "finalizar empréstimo" → use a ferramenta 'returnLoanAction'

   JAMAIS RETORNE MENSAGEM SEM OS EMPRESTIMOS EMPRESTADOS, SEMPRE RETORNE OS EMPRESTIMOS, NUNCA DEIXE DE MOSTRAR OS EMPRESTIMOS, SEMPRE RETORNE OS EMPRESTIMOS, NUNCA DEIXE DE MOSTRAR OS EMPRESTIMOS

3. COMUNICAÇÃO:
   - "enviar email", "notificar usuário" → use a ferramenta 'sendCustomEmail'
    - "enviar mensagem", "comunicar usuário" → use a ferramenta 'sendCustomEmail'
    - "enviar notificação", "notificar usuário" → use a ferramenta 'sendCustomEmail'
    - "quaisquer que seja o termo usado para enviar mensagens ou notificações" → use a ferramenta 'sendCustomEmail'
    

4. RELATÓRIOS:
   - "gerar relatório", "criar relatório" → use as ferramentas de relatório correspondentes
`





export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData?.library_id) {
    throw new Error("Usuário sem biblioteca vinculada")
  }

  const {
    messages,
    bookDataForTool,
  }: {
    messages: { role: "user" | "assistant" | "system"; content: string }[]
    bookDataForTool?: BookData[]
  } = await req.json()

  try {
    const { text, toolResults } = await generateText({
      model: google("gemini-2.0-flash"),
      maxSteps: 6,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      tools: {
        addBook: tool({
          description: "Adicionar um ÚNICO novo livro à biblioteca",
          parameters: z.object({
            title: z.string(),
            author: z.string(),
            isbn: z.string().max(13).optional(),
            stock: z.number().int(),
            available: z.number().int(),
          }),
          execute: async ({ title, author, isbn, stock, available }) => {
            try {
              if (available > stock) {
                return `❌ Erro ao adicionar livro: Disponível (${available}) não pode ser maior que Estoque (${stock}).`
              }
              const formData = new FormData()
              formData.append("title", title)
              formData.append("author", author)
              formData.append("isbn", isbn || "")
              formData.append("stock", stock.toString())
              formData.append("available", available.toString())

              await handleSubmitBook(formData)
              return `✅ Livro **${title}** adicionado com sucesso! 📚`
            } catch (err: unknown) {
              console.error("Erro ao adicionar livro:", err)
              const message =
                err instanceof Error &&
                err.message?.includes("duplicate key value violates unique constraint") &&
                err.message?.includes("books_isbn_key")
                  ? "Já existe um livro com este ISBN."
                  : err instanceof Error && err.message?.includes('violates check constraint "books_available_check"')
                    ? "A quantidade disponível não pode ser maior que o estoque."
                    : "Ocorreu um erro."
              return `❌ Erro ao adicionar livro: ${message}`
            }
          },
        }),

    
      listBooks: tool({
        description: "Listar todos os livros cadastrados com formatação em tabela",
        parameters: z.object({}),
        execute: async () => {
          try {
            const { data, error } = await supabase
              .from("books")
              .select("id, title, author, isbn, stock, available")
              .eq("library_id", userData.library_id)
              .order("created_at", { ascending: false })

            if (error) throw error
            if (!data || data.length === 0) {
              return `📚 **Nenhum livro encontrado na biblioteca.**\n\nPara adicionar um novo livro, diga: *"adicionar livro"*`
            }

            const totalBooks = data.length
            const booksToShow = data.slice(0, 15) // Mostrar mais livros na tabela

            let markdownOutput = `📚 **Acervo da Biblioteca** (${totalBooks} ${totalBooks === 1 ? "livro" : "livros"} cadastrados)\n\n`

            // Cabeçalho da tabela com emojis e formatação melhorada
            markdownOutput += `| 🆔 ID | 📖 Título | ✍️ Autor | 📊 Estoque | 📋 Disponível |\n`
            markdownOutput += `|-------|-----------|----------|------------|---------------|\n`

            // Linhas da tabela com formatação melhorada
            for (const book of booksToShow) {
              const title = book.title.length > 30 ? book.title.substring(0, 30) + "..." : book.title
              const author = book.author.length > 25 ? book.author.substring(0, 25) + "..." : book.author
              const stockStatus = book.available === 0 ? "❌ Esgotado" : `✅ ${book.available}`

              markdownOutput += `| **${book.id}** | ${title} | ${author} | ${book.stock} | ${stockStatus} |\n`
            }

            if (totalBooks > 15) {
              markdownOutput += `\n📋 **Mostrando os ${booksToShow.length} livros mais recentes.** Há mais ${totalBooks - 15} livros não exibidos.\n`
            }

            markdownOutput += `\n💡 **Dicas:**\n`
            markdownOutput += `• Para ver detalhes completos: *"detalhes do livro ID X"*\n`
            markdownOutput += `• Para buscar por título: *"buscar livro [nome]"*\n`
            markdownOutput += `• Para adicionar novo livro: *"adicionar livro"*`

            return markdownOutput.trim()
          } catch (err) {
            console.error("Erro ao listar livros:", err)
            return `❌ **Erro ao carregar lista de livros:** ${err instanceof Error ? err.message : "Erro desconhecido"}\n\nTente novamente ou entre em contato com o suporte.`
          }
        },
      }),




        addMultipleBooks: tool({
          description: "Adicionar MÚLTIPLOS livros à biblioteca APÓS o usuário confirmar explicitamente",
          parameters: z.object({
            confirmation: z.boolean().describe("Confirmação final para adicionar os livros processados."),
          }),
          execute: async ({ confirmation }) => {
            if (!confirmation) {
              return "❓ Adição cancelada. Nenhuma confirmação recebida."
            }
            if (!bookDataForTool || bookDataForTool.length === 0) {
              return "❌ Nenhum dado de livro válido encontrado para adicionar."
            }

            let successCount = 0
            let errorCount = 0
            const errors: { title: string; error: string }[] = []

            for (const book of bookDataForTool) {
              try {
                if (book.available > book.stock) {
                  throw new Error(`Disponível (${book.available}) excede o Estoque (${book.stock}).`)
                }

                const formData = new FormData()
                formData.append("title", book.title)
                formData.append("author", book.author)
                formData.append("isbn", book.isbn || "")
                formData.append("stock", book.stock.toString())
                formData.append("available", book.available.toString())

                await handleSubmitBook(formData)
                successCount++
              } catch (err: unknown) {
                errorCount++
                const message =
                  err instanceof Error &&
                  err.message?.includes("duplicate key value violates unique constraint") &&
                  err.message?.includes("books_isbn_key")
                    ? "ISBN duplicado."
                    : err instanceof Error && err.message?.includes('violates check constraint "books_available_check"')
                      ? "Disponível > Estoque."
                      : "Erro desconhecido."
                errors.push({ title: book.title, error: message })
                console.error(`Erro ao adicionar livro "${book.title}":`, err)
              }
            }

            let resultMessage = `✅ ${successCount} ${successCount === 1 ? "livro adicionado" : "livros adicionados"} com sucesso.`
            if (errorCount > 0) {
              resultMessage += `\n❌ Falha ao adicionar ${errorCount} ${errorCount === 1 ? "livro" : "livros"}.`
              if (errors.length < 5) {
                resultMessage += "\n   Erros: " + errors.map((e) => `"${e.title}" (${e.error})`).join(", ")
              }
            }
            resultMessage += "\n Operação concluída. 📚"

            return resultMessage
          },
        }),

        listRecentLoans: tool({
          description: "Listar os 5 empréstimos mais recentes com formatação aprimorada",
          parameters: z.object({}),
          execute: async () => {
            try {
              const { data: userData } = await supabase.from("users").select("library_id").eq("id", user.id).single()
              if (!userData?.library_id) throw new Error("Usuário sem biblioteca")

              const { data: loans, error } = (await supabase
                .from("loans")
                .select(`
                  id,
                  created_at,
                  due_date,
                  status,
                  books:book_id ( title ),
                  users:user_id ( full_name )
                `)
                .eq("library_id", userData.library_id)
                .order("created_at", { ascending: false })
                .limit(5)) as { data: Loan[] | null; error: unknown }

              if (error) throw error
              if (!loans || loans.length === 0) return `Nenhum empréstimo recente encontrado.`

              let markdownOutput = "**Últimos 5 Empréstimos:**\n\n"
              for (const loan of loans) {
                const loanStatus = loan.status === "active" ? "✅ Ativo" : "↩️ Devolvido"
                markdownOutput += `- **ID:** ${loan.id}\n`
                markdownOutput += `  📚 **Livro:** ${loan.books?.title ?? "-"}\n`
                markdownOutput += `  👤 **Usuário:** ${loan.users?.full_name ?? "-"}\n`
                markdownOutput += `  📅 **Empréstimo:** ${new Date(loan.created_at).toLocaleDateString("pt-BR")}\n`
                markdownOutput += `  🗓️ **Vencimento:** ${new Date(loan.due_date).toLocaleDateString("pt-BR")}\n`
                markdownOutput += `  📊 **Status:** ${loanStatus}\n\n`
              }

              return markdownOutput.trim()
            } catch (err) {
              console.error("Erro ao listar empréstimos:", err)
              return "❌ Erro ao listar empréstimos."
            }
          },
        }),

        deleteBook: tool({
          description: "Excluir um livro pelo ID",
          parameters: z.object({ id: z.string() }),
          execute: async ({ id }) => {
            try {
              await handleDeleteBook(id)
              return `✅ Livro com ID **${id}** excluído com sucesso. 🗑️`
            } catch (err) {
              if (err instanceof Error && err.message.includes("empréstimos ativos")) {
                return "❌ Não é possível excluir um livro que possui empréstimos ativos. Por favor, finalize os empréstimos antes de tentar excluir."
              }
              console.error("Erro desconhecido ao excluir livro:", err)
              return "❌ Ocorreu um erro inesperado ao tentar excluir o livro."
            }
          },
        }),


        sendCustomEmail: tool({
          description: "Enviar um email personalizado para um usuário da biblioteca",
          parameters: z.object({
            email: z.string(),
            subject: z.string(),
            message: z.string(),
          }),
          execute: async ({ email, subject, message }) => {
            try {
              const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number.parseInt(process.env.EMAIL_PORT || "587"),
                secure: process.env.EMAIL_SECURE === "true",
                auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
                },
              })
              await transporter.sendMail({
                from: `"Biblioteca Digital" <${process.env.EMAIL_FROM}>`,
                to: email,
                subject: subject,
                html: `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;"><p>${message}</p></div>`,
              })
              return `✅ Email enviado com sucesso para ${email}! 📧`
            } catch (err) {
              console.error("Erro ao enviar email:", err)
              return `❌ Erro ao enviar email: ${err instanceof Error ? err.message : "Erro desconhecido"}`
            }
          },
        }),

        generateBookReport: tool({
          description: "Gerar relatório detalhado sobre os livros da biblioteca",
          parameters: z.object({
            format: z.enum(["pdf", "excel"]).describe("Formato do relatório: pdf ou excel"),
            includeDetails: z.boolean().describe("Se deve incluir detalhes completos de cada livro"),
          }),
          execute: async ({ format, includeDetails }) => {
            try {
              const { data: books, error } = await supabase
                .from("books")
                .select("*")
                .eq("library_id", userData.library_id)
                .order("title", { ascending: true })

              if (error) throw error
              if (!books || books.length === 0) {
                return "❌ Não há livros cadastrados para gerar o relatório."
              }

              const reportType = format === "pdf" ? "PDF" : "Excel"
              const detailLevel = includeDetails ? "detalhado" : "resumido"
              const reportUrl = `https://biblioteca-digital.example.com/reports/books-${Date.now()}.${format}`

              return `✅ Relatório ${detailLevel} de livros gerado com sucesso em formato ${reportType}!\n\nVocê pode acessá-lo através do link: ${reportUrl}\n\nO relatório contém informações sobre ${books.length} livros da sua biblioteca.`
            } catch (err) {
              console.error("Erro ao gerar relatório de livros:", err)
              return `❌ Erro ao gerar relatório de livros: ${err instanceof Error ? err.message : "Erro desconhecido"}`
            }
          },
        }),
      },
    })

    let responseContent = text
    if (toolResults && toolResults.length > 0) {
      responseContent = toolResults.map((result) => result.result).join("\n")
    }
    if (!responseContent) {
      responseContent = "Não consegui processar sua solicitação ou gerar uma resposta."
      console.warn("generateText retornou sem texto ou resultados de ferramentas.")
    }

    return new Response(JSON.stringify({ role: "assistant", content: responseContent }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Erro ao processar a requisição de chat:", error)
    let errorMessage = "Ocorreu um erro desconhecido ao processar sua solicitação."
    if (error instanceof Error) {
      errorMessage = `❌ Erro: ${error.message}`
    } else if (typeof error === "string") {
      errorMessage = `❌ Erro: ${error}`
    }
    if (errorMessage.includes("deadline")) {
      errorMessage =
        "❌ Desculpe, a solicitação demorou muito para ser processada. Tente novamente ou simplifique sua pergunta."
    }
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
