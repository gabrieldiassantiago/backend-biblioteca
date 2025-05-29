import { createClient } from "@/lib/supabase/server";
import { handleDeleteBook, handleSubmitBook } from "@/app/(admin)/admin/books/book-actions";
import { generateText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import nodemailer from "nodemailer";

// Interfaces
interface BookData {
  title: string;
  author: string;
  isbn?: string;
  stock: number;
  available: number;
}

interface Loan {
  id: string;
  created_at: string;
  due_date: string;
  status: string;
  books: { title: string } | null;
  users: { full_name: string } | null;
}

// Sistema de prompt melhorado com instruções mais específicas e exemplos claros
const systemPrompt = `
Você é a Biblioteca AI 📚, um assistente inteligente para gerenciamento de bibliotecas digitais.

## INSTRUÇÕES GERAIS
- Ao adicionar livros em massa via Excel, sempre confirme com o usuário antes de adicionar.
- Explique claramente para o usuário o que é o ISBN, sua importância e como encontrá-lo (ex: na contracapa ou página de dados do livro).
- Se o usuário pedir "ajuda", explique o que cada ferramenta pode fazer, com exemplos simples.
- Se o usuário fornecer um ISBN, use a ferramenta de busca para retornar dados completos do livro, incluindo título, autor, estoque e disponibilidade.
- Para listar livros, mostre uma lista resumida com os 10 livros mais recentes, informe o total e oriente como fazer buscas específicas.
- Sempre valide IDs e nomes fornecidos; se estiverem incompletos ou ambíguos, ajude o usuário a encontrar os dados corretos antes de prosseguir.
- Para datas, sempre oriente o usuário a usar o formato ISO (AAAA-MM-DD) e forneça exemplos claros.
- Seja educado, claro e objetivo. Explique passos quando necessário, especialmente para usuários iniciantes.
- Sempre confirme ações importantes, como exclusão de livros ou confirmações de empréstimos.
- Jamais retorne algo sem o que eu solicite, exemplo, se eu pedir para listar livros, não me retorne uma mensagem tipo "aqui esta" mas sem a lista.

## COMANDOS E FERRAMENTAS
Quando o usuário solicitar as seguintes ações, use EXATAMENTE a ferramenta correspondente:

1. LIVROS:
   - "listar livros", "mostrar livros", "ver livros" → use a ferramenta 'listBooks'
   - "adicionar livro", "cadastrar livro", "novo livro" → use a ferramenta 'addBook'
   - "excluir livro", "remover livro", "deletar livro" → use a ferramenta 'deleteBook'
   - "adicionar vários livros", "importar livros" → use a ferramenta 'addMultipleBooks'

2. EMPRÉSTIMOS:
   - "listar empréstimos", "mostrar empréstimos", "ver empréstimos" → use a ferramenta 'listRecentLoans'
   - "renovar empréstimo", "estender empréstimo" → use a ferramenta 'renewLoanAction'
   - "devolver livro", "finalizar empréstimo" → use a ferramenta 'returnLoanAction'

3. COMUNICAÇÃO:
   - "enviar email", "notificar usuário" → use a ferramenta 'sendCustomEmail'

4. RELATÓRIOS:
   - "gerar relatório", "criar relatório" → use as ferramentas de relatório correspondentes
`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.library_id) {
    throw new Error("Usuário sem biblioteca vinculada");
  }

  const { messages, bookDataForTool }: {
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    bookDataForTool?: BookData[];
  } = await req.json();

  try {
    

    const { text, toolResults } = await generateText({
      model: google("gemini-2.0-flash"),
      maxSteps: 6,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
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
                return `❌ Erro ao adicionar livro: Disponível (${available}) não pode ser maior que Estoque (${stock}).`;
              }
              const formData = new FormData();
              formData.append("title", title);
              formData.append("author", author);
              formData.append("isbn", isbn || "");
              formData.append("stock", stock.toString());
              formData.append("available", available.toString());

              await handleSubmitBook(formData);
              return `✅ Livro **${title}** adicionado com sucesso! 📚`;
            } catch (err: unknown) {
              console.error("Erro ao adicionar livro:", err);
              const message =
                err instanceof Error &&
                err.message?.includes("duplicate key value violates unique constraint") &&
                err.message?.includes("books_isbn_key")
                  ? "Já existe um livro com este ISBN."
                  : err instanceof Error &&
                    err.message?.includes('violates check constraint "books_available_check"')
                  ? "A quantidade disponível não pode ser maior que o estoque."
                  : "Ocorreu um erro.";
              return `❌ Erro ao adicionar livro: ${message}`;
            }
          },
        }),

        listBooks: tool({
          description: "Listar todos os livros cadastrados com formatação aprimorada",
          parameters: z.object({}),
          execute: async () => {
            try {
              const { data, error } = await supabase
                .from("books")
                .select("id, title, author")
                .eq("library_id", userData.library_id)
                .order("created_at", { ascending: false });

              if (error) throw error;
              if (!data || data.length === 0) {
                return `📚 Nenhum livro encontrado.`;
              }

              const totalBooks = data.length;
              const booksToShow = data.slice(0, 10);

              let markdownOutput = `📚 **Total de livros cadastrados:** ${totalBooks}\n\n**Últimos ${booksToShow.length} livros:**\n\n`;

              for (const b of booksToShow) {
                markdownOutput += `- **ID:** ${b.id} | 📚 ${b.title} | ✍️ ${b.author}\n`;
              }

              if (totalBooks > 10) {
                markdownOutput += `\n⚠️ E mais ${totalBooks - 10} livros não mostrados. Use filtros para buscas específicas.`;
              }

              markdownOutput += `\n\nVocê pode pedir para buscar um livro específico pelo título ou ISBN, ou solicitar informações detalhadas de um livro pelo ID.`;

              return markdownOutput.trim();
            } catch (err) {
              console.error("Erro ao listar livros:", err);
              return `❌ Erro ao listar livros: ${err instanceof Error ? err.message : "Erro desconhecido."}`;
            }
          },
        }),

        addMultipleBooks: tool({
          description:
            "Adicionar MÚLTIPLOS livros à biblioteca APÓS o usuário confirmar explicitamente a partir de um arquivo Excel processado. Requer a lista de livros válidos.",
          parameters: z.object({
            confirmation: z.boolean().describe("Confirmação final para adicionar os livros processados."),
          }),
          execute: async ({ confirmation }) => {
            if (!confirmation) {
              return "❓ Adição cancelada. Nenhuma confirmação recebida.";
            }
            if (!bookDataForTool || bookDataForTool.length === 0) {
              return "❌ Nenhum dado de livro válido encontrado para adicionar. O arquivo pode não ter sido processado ou não continha livros válidos.";
            }

            let successCount = 0;
            let errorCount = 0;
            const errors: { title: string; error: string }[] = [];

            for (const book of bookDataForTool) {
              try {
                if (book.available > book.stock) {
                  throw new Error(`Disponível (${book.available}) excede o Estoque (${book.stock}).`);
                }

                const formData = new FormData();
                formData.append("title", book.title);
                formData.append("author", book.author);
                formData.append("isbn", book.isbn || "");
                formData.append("stock", book.stock.toString());
                formData.append("available", book.available.toString());

                await handleSubmitBook(formData);
                successCount++;
              } catch (err: unknown) {
                errorCount++;
                const message =
                  err instanceof Error &&
                  err.message?.includes("duplicate key value violates unique constraint") &&
                  err.message?.includes("books_isbn_key")
                    ? "ISBN duplicado."
                    : err instanceof Error && err.message?.includes('violates check constraint "books_available_check"')
                    ? "Disponível > Estoque."
                    : "Erro desconhecido.";
                errors.push({ title: book.title, error: message });
                console.error(`Erro ao adicionar livro "${book.title}":`, err);
              }
            }

            let resultMessage = `✅ ${successCount} ${successCount === 1 ? "livro adicionado" : "livros adicionados"} com sucesso.`;
            if (errorCount > 0) {
              resultMessage += `\n❌ Falha ao adicionar ${errorCount} ${errorCount === 1 ? "livro" : "livros"}.`;
              if (errors.length < 5) {
                resultMessage += "\n   Erros: " + errors.map(e => `"${e.title}" (${e.error})`).join(", ");
              }
            }
            resultMessage += "\n Operação concluída. 📚";

            return resultMessage;
          },
        }),

        listRecentLoans: tool({
          description: "Listar os 5 empréstimos mais recentes com formatação aprimorada",
          parameters: z.object({}),
          execute: async () => {
            try {
              const { data: userData } = await supabase
                .from("users")
                .select("library_id")
                .eq("id", user.id)
                .single();
              if (!userData?.library_id) throw new Error("Usuário sem biblioteca");

              const { data: loans, error } = await supabase
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
                .limit(5) as { data: Loan[] | null; error: unknown };

              if (error) throw error;
              if (!loans || loans.length === 0) return `Nenhum empréstimo recente encontrado.`;

              let markdownOutput = "**Últimos 5 Empréstimos:**\n\n";
              for (const loan of loans) {
                const loanStatus = loan.status === 'active' ? '✅ Ativo' : '↩️ Devolvido';
                markdownOutput += `- **ID:** ${loan.id}\n`;
                markdownOutput += `  📚 **Livro:** ${loan.books?.title ?? "-"}\n`;
                markdownOutput += `  👤 **Usuário:** ${loan.users?.full_name ?? "-"}\n`;
                markdownOutput += `  📅 **Empréstimo:** ${new Date(loan.created_at).toLocaleDateString("pt-BR")}\n`;
                markdownOutput += `  🗓️ **Vencimento:** ${new Date(loan.due_date).toLocaleDateString("pt-BR")}\n`;
                markdownOutput += `  📊 **Status:** ${loanStatus}\n\n`;
              }

              return markdownOutput.trim();
            } catch (err) {
              console.error("Erro ao listar empréstimos:", err);
              return "❌ Erro ao listar empréstimos.";
            }
          },
        }),

        deleteBook: tool({
          description: "Excluir um livro pelo ID",
          parameters: z.object({ id: z.string() }),
          execute: async ({ id }) => {
            try {
              await handleDeleteBook(id);
              return `✅ Livro com ID **${id}** excluído com sucesso. 🗑️`;
            } catch (err) {
              if (err instanceof Error && err.message.includes("empréstimos ativos")) {
                return "❌ Não é possível excluir um livro que possui empréstimos ativos. Por favor, finalize os empréstimos antes de tentar excluir.";
              }
              console.error("Erro desconhecido ao excluir livro:", err);
              return "❌ Ocorreu um erro inesperado ao tentar excluir o livro.";
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
              });
              await transporter.sendMail({
                from: `"Biblioteca Digital" <${process.env.EMAIL_FROM}>`,
                to: email,
                subject: subject,
                html: `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;"><p>${message}</p></div>`,
              });
              return `✅ Email enviado com sucesso para ${email}! 📧`;
            } catch (err) {
              console.error("Erro ao enviar email:", err);
              return `❌ Erro ao enviar email: ${err instanceof Error ? err.message : "Erro desconhecido"}`;
            }
          },
        }),

        // Ferramentas de geração de relatórios - mantidas do arquivo original
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
                .order("title", { ascending: true });

              if (error) throw error;
              if (!books || books.length === 0) {
                return "❌ Não há livros cadastrados para gerar o relatório.";
              }

              // Simulação de geração de relatório
              const reportType = format === "pdf" ? "PDF" : "Excel";
              const detailLevel = includeDetails ? "detalhado" : "resumido";
              const reportUrl = `https://biblioteca-digital.example.com/reports/books-${Date.now()}.${format}`;

              return `✅ Relatório ${detailLevel} de livros gerado com sucesso em formato ${reportType}!\n\nVocê pode acessá-lo através do link: ${reportUrl}\n\nO relatório contém informações sobre ${books.length} livros da sua biblioteca.`;
            } catch (err) {
              console.error("Erro ao gerar relatório de livros:", err);
              return `❌ Erro ao gerar relatório de livros: ${err instanceof Error ? err.message : "Erro desconhecido"}`;
            }
          },
        }),

        generateLoanReport: tool({
          description: "Gerar relatório de empréstimos da biblioteca",
          parameters: z.object({
            format: z.enum(["pdf", "excel"]).describe("Formato do relatório: pdf ou excel"),
            status: z.enum(["all", "active", "returned"]).describe("Status dos empréstimos a incluir"),
            dateRange: z.enum(["all", "last_week", "last_month", "last_year"]).describe("Período de tempo a considerar"),
          }),
          execute: async ({ format, status, dateRange }) => {
            try {
              let query = supabase
                .from("loans")
                .select(`
                  id,
                  created_at,
                  due_date,
                  returned_at,
                  status,
                  books:book_id ( title, author ),
                  users:user_id ( full_name, email )
                `)
                .eq("library_id", userData.library_id);

              // Filtrar por status
              if (status !== "all") {
                query = query.eq("status", status);
              }

              // Filtrar por período
              if (dateRange !== "all") {
                const now = new Date();
                let startDate;
                
                switch (dateRange) {
                  case "last_week":
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                  case "last_month":
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                  case "last_year":
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                }
                
                query = query.gte("created_at", startDate?.toISOString());
              }

              const { data: loans, error } = await query.order("created_at", { ascending: false });

              if (error) throw error;
              if (!loans || loans.length === 0) {
                return "❌ Não há empréstimos que correspondam aos critérios selecionados.";
              }

              // Simulação de geração de relatório
              const reportType = format === "pdf" ? "PDF" : "Excel";
              const statusText = status === "all" ? "todos os status" : status === "active" ? "ativos" : "devolvidos";
              const dateRangeText = dateRange === "all" ? "todo o período" : 
                                   dateRange === "last_week" ? "última semana" : 
                                   dateRange === "last_month" ? "último mês" : "último ano";
              
              const reportUrl = `https://biblioteca-digital.example.com/reports/loans-${Date.now()}.${format}`;

              return `✅ Relatório de empréstimos gerado com sucesso em formato ${reportType}!\n\nVocê pode acessá-lo através do link: ${reportUrl}\n\nO relatório contém informações sobre ${loans.length} empréstimos (${statusText}) de ${dateRangeText}.`;
            } catch (err) {
              console.error("Erro ao gerar relatório de empréstimos:", err);
              return `❌ Erro ao gerar relatório de empréstimos: ${err instanceof Error ? err.message : "Erro desconhecido"}`;
            }
          },
        }),

        generateUserReport: tool({
          description: "Gerar relatório de usuários da biblioteca",
          parameters: z.object({
            format: z.enum(["pdf", "excel"]).describe("Formato do relatório: pdf ou excel"),
            includeInactive: z.boolean().describe("Se deve incluir usuários inativos"),
          }),
          execute: async ({ format, includeInactive }) => {
            try {
              let query = supabase
                .from("users")
                .select("*")
                .eq("library_id", userData.library_id);

              if (!includeInactive) {
                query = query.eq("is_active", true);
              }

              const { data: users, error } = await query.order("full_name", { ascending: true });

              if (error) throw error;
              if (!users || users.length === 0) {
                return "❌ Não há usuários cadastrados para gerar o relatório.";
              }

              // Simulação de geração de relatório
              const reportType = format === "pdf" ? "PDF" : "Excel";
              const userStatus = includeInactive ? "todos os usuários (ativos e inativos)" : "apenas usuários ativos";
              const reportUrl = `https://biblioteca-digital.example.com/reports/users-${Date.now()}.${format}`;

              return `✅ Relatório de usuários gerado com sucesso em formato ${reportType}!\n\nVocê pode acessá-lo através do link: ${reportUrl}\n\nO relatório contém informações sobre ${users.length} usuários (${userStatus}) da sua biblioteca.`;
            } catch (err) {
              console.error("Erro ao gerar relatório de usuários:", err);
              return `❌ Erro ao gerar relatório de usuários: ${err instanceof Error ? err.message : "Erro desconhecido"}`;
            }
          },
        }),

        // Você pode continuar adicionando outras ferramentas aqui conforme seu projeto
      },
    });

    let responseContent = text;
    if (toolResults && toolResults.length > 0) {
      responseContent = toolResults.map(result => result.result).join("\n");
    }
    if (!responseContent) {
      responseContent = "Não consegui processar sua solicitação ou gerar uma resposta.";
      console.warn("generateText retornou sem texto ou resultados de ferramentas.");
    }

    return new Response(JSON.stringify({ role: "assistant", content: responseContent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro ao processar a requisição de chat:", error);
    let errorMessage = "Ocorreu um erro desconhecido ao processar sua solicitação.";
    if (error instanceof Error) {
      errorMessage = `❌ Erro: ${error.message}`;
    } else if (typeof error === "string") {
      errorMessage = `❌ Erro: ${error}`;
    }
    if (errorMessage.includes("deadline")) {
      errorMessage = "❌ Desculpe, a solicitação demorou muito para ser processada. Tente novamente ou simplifique sua pergunta.";
    }
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

