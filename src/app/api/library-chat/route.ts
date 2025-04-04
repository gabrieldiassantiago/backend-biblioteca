import { createClient } from "@/lib/supabase/server";
import { handleDeleteBook, handleSubmitBook } from "@/app/(admin)/admin/books/actions";

export const maxDuration = 30;

const systemPrompt = `
Você é Biblioteca AI, um assistente inteligente para um sistema de gerenciamento de biblioteca.
Você pode ajudar os usuários a gerenciar livros e empréstimos no banco de dados da biblioteca através de linguagem natural.

Você pode realizar as seguintes ações:
1. Adicionar um novo livro ao banco de dados
2. Excluir um livro do banco de dados
3. Pesquisar livros (todos, disponíveis, por autor, por título)
4. Criar um novo empréstimo de livro
5. Verificar status de empréstimos
6. Fornecer informações sobre o sistema da biblioteca

Quando um usuário quiser adicionar um livro, colete as seguintes informações:
- Título (obrigatório)
- Autor (obrigatório)
- ISBN (obrigatório, DEVE ter no máximo 13 caracteres)
- Quantidade em estoque (obrigatório, deve ser um número inteiro positivo)
- Quantidade disponível (obrigatório, deve ser um número inteiro positivo e não pode exceder o estoque)

IMPORTANTE: Quando um usuário disser algo como "Quero emprestar o livro [nome do livro] para [nome do usuário]", você deve:
1. Extrair o nome do livro e o nome do usuário da mensagem
2. Usar searchBooks para encontrar o livro pelo título
3. Usar searchUsers para encontrar o usuário pelo nome
4. Se encontrar exatamente um livro e um usuário, perguntar ao usuário se deseja confirmar o empréstimo
5. Se encontrar múltiplos livros ou usuários, pedir ao usuário para escolher o correto
6. Usar createLoan para registrar o empréstimo após a confirmação

IMPORTANTE: Para qualquer operação de banco de dados, você deve chamar a função apropriada:
- Para adicionar um livro: chame a função addBook com os detalhes do livro
- Para excluir um livro: chame a função deleteBook com o ID do livro
- Para pesquisar livros: chame a função searchBooks com a consulta
- Para pesquisar apenas livros disponíveis: chame a função searchAvailableBooks
- Para pesquisar usuários: chame a função searchUsers com o nome
- Para criar um empréstimo: chame a função createLoan com os detalhes do empréstimo
- Para verificar empréstimos: chame a função checkLoans com o ID do usuário ou livro

Sempre confirme com o usuário antes de realizar qualquer ação destrutiva como exclusão.

Ao apresentar resultados de livros ou empréstimos, formate-os de maneira clara e organizada.

Quando o usuário disser algo como "quero emprestar um livro", pergunte qual livro e para qual usuário.
`;

// Interface para mensagens
interface Message {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

// Interface para a resposta do Gemini
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        functionCall?: {
          name: string;
          args: Record<string, string | number>; // Tipagem mais específica para args
        };
      }>;
    };
    finishReason: string;
  }>;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  class?: string; // Turma do aluno (opcional, caso nem todos os usuários tenham)
  grade?: string; // Série do aluno (opcional)
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  stock: number;
  available: number;
}

interface Loan {
  id: string;
  created_at: string;
  due_date: string;
  status: string;
  books: Book;
  users: User;
}

// Função para validar os dados do livro
function validateBookData(book: {
  title: string;
  author: string;
  isbn: string;
  stock: number;
  available: number;
}): { isValid: boolean; error?: string } {
  if (book.isbn.length > 13) {
    return {
      isValid: false,
      error: `O ISBN deve ter no máximo 13 caracteres. O valor fornecido tem ${book.isbn.length} caracteres.`,
    };
  }
  if (isNaN(book.stock) || book.stock < 0) {
    return { isValid: false, error: "O estoque deve ser um número inteiro positivo." };
  }
  if (isNaN(book.available) || book.available < 0) {
    return { isValid: false, error: "A quantidade disponível deve ser um número inteiro positivo." };
  }
  if (book.available > book.stock) {
    return { isValid: false, error: "A quantidade disponível não pode ser maior que o estoque." };
  }
  return { isValid: true };
}

// Função para formatar a data em formato brasileiro
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Função para formatar o status do empréstimo
function formatLoanStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Ativo",
    returned: "Devolvido",
    overdue: "Atrasado",
    pending: "Pendente",
    rejected: "Rejeitado",
  };
  return statusMap[status] || status;
}

// Função para extrair informações de empréstimo de uma mensagem
function extractLoanInfo(message: string): { bookName?: string; userName?: string } {
  const patterns = [
    /emprestar\s+(?:o\s+)?(?:livro\s+)?["']?([^"']+)["']?\s+(?:para|a|ao|à)\s+["']?([^"']+)["']?/i,
    /emprestar\s+(?:para|a|ao|à)\s+["']?([^"']+)["']?\s+(?:o\s+)?(?:livro\s+)?["']?([^"']+)["']?/i,
    /pegar\s+(?:emprestado\s+)?(?:o\s+)?(?:livro\s+)?["']?([^"']+)["']?\s+(?:para|a|ao|à)\s+["']?([^"']+)["']?/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return pattern === patterns[0] || pattern === patterns[2]
        ? { bookName: match[1].trim(), userName: match[2].trim() }
        : { bookName: match[2].trim(), userName: match[1].trim() };
    }
  }
  return {};
}

// Função searchUsers com tipagem corrigida, incluindo turma e série
async function searchUsers(query: string): Promise<{ success: boolean; message: string; users?: User[] }> {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: "Usuário não autenticado" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("library_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.library_id) {
      return { success: false, message: "Usuário não está vinculado a uma biblioteca" };
    }

    const libraryId = userData.library_id;

    // Modificamos a consulta para incluir class e grade
    const { data: users, error } = await supabase
      .from("users")
      .select("id, full_name, email, class, grade") // Adiciona class e grade
      .eq("library_id", libraryId)
      .ilike("full_name", `%${query}%`)
      .limit(10);

    if (error) {
      return { success: false, message: `Erro ao buscar usuários: ${error.message}` };
    }

    return {
      success: true,
      message: users && users.length > 0 ? "Usuários encontrados" : "Nenhum usuário encontrado",
      users: users || [],
    };
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return {
      success: false,
      message: `Erro ao buscar usuários: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
  }
}

// Função createLoan com tipagem corrigida
async function createLoan(
  bookId: string,
  userId: string,
  dueDate?: string,
): Promise<{ success: boolean; message: string; loanId?: string; bookTitle?: string; userName?: string }> {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: "Usuário não autenticado" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("library_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.library_id) {
      return { success: false, message: "Usuário não está vinculado a uma biblioteca" };
    }

    const libraryId = userData.library_id;

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("available, library_id, title, author")
      .eq("id", bookId)
      .eq("library_id", libraryId)
      .single();

    if (bookError || !book) {
      return { success: false, message: "Livro não encontrado" };
    }

    if (book.available <= 0) {
      return { success: false, message: "Livro não disponível para empréstimo" };
    }

    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id, library_id, full_name")
      .eq("id", userId)
      .eq("library_id", libraryId)
      .single();

    if (targetUserError || !targetUser) {
      return { success: false, message: "Usuário não encontrado" };
    }

    let dueDateValue = dueDate;
    if (!dueDateValue) {
      const date = new Date();
      date.setDate(date.getDate() + 14);
      dueDateValue = date.toISOString();
    }

    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .insert({
        book_id: bookId,
        user_id: userId,
        library_id: libraryId,
        due_date: dueDateValue,
        status: "active",
      })
      .select("id")
      .single();

    if (loanError) {
      return { success: false, message: `Erro ao criar empréstimo: ${loanError.message}` };
    }

    const { error: updateError } = await supabase
      .from("books")
      .update({ available: book.available - 1, updated_at: new Date().toISOString() })
      .eq("id", bookId)
      .eq("library_id", libraryId);

    if (updateError) {
      return { success: false, message: `Erro ao atualizar disponibilidade do livro: ${updateError.message}` };
    }
    

    return {
      success: true,
      message: "Empréstimo criado com sucesso",
      loanId: loan.id,
      bookTitle: book.title,
      userName: targetUser.full_name,
    };
  } catch (error) {
    console.error("Erro ao criar empréstimo:", error);
    return {
      success: false,
      message: `Erro ao criar empréstimo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
  }
}

// Função checkLoans com tipagem corrigida
async function checkLoans(query: { userId?: string; bookId?: string }): Promise<{
  success: boolean;
  message: string;
  loans?: Loan[];
}> {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: "Usuário não autenticado" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("library_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.library_id) {
      return { success: false, message: "Usuário não está vinculado a uma biblioteca" };
    }

    const libraryId = userData.library_id;

    let loansQuery = supabase
      .from("loans")
      .select(`
        id,
        created_at,
        due_date,
        status,
        books:book_id(id, title, author, isbn),
        users:user_id(id, full_name, email)
      `)
      .eq("library_id", libraryId);

    if (query.userId) loansQuery = loansQuery.eq("user_id", query.userId);
    if (query.bookId) loansQuery = loansQuery.eq("book_id", query.bookId);

    const { data: loans, error: loansError } = await loansQuery
      .order("created_at", { ascending: false })
      // Tipagem explícita para o resultado
      .returns<Loan[]>();

    if (loansError) {
      return { success: false, message: `Erro ao buscar empréstimos: ${loansError.message}` };
    }

    return {
      success: true,
      message: loans && loans.length > 0 ? "Empréstimos encontrados" : "Nenhum empréstimo encontrado",
      loans: loans || [],
    };
  } catch (error) {
    console.error("Erro ao verificar empréstimos:", error);
    return {
      success: false,
      message: `Erro ao verificar empréstimos: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
  }
}

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();
  const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

  if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(JSON.stringify({ error: "GOOGLE_GENERATIVE_AI_API_KEY não está configurada" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const lastUserMessage = messages.findLast((msg) => msg.role === "user")?.content || "";
    const loanInfo = extractLoanInfo(lastUserMessage);

    if (loanInfo.bookName && loanInfo.userName) {
      const supabase = await createClient();
      const { data: books } = await supabase
        .from("books")
        .select("id, title, author, isbn, stock, available")
        .ilike("title", `%${loanInfo.bookName}%`)
        .gt("available", 0)
        .limit(5);

      const { users } = await searchUsers(loanInfo.userName);

      if (books?.length === 1 && users?.length === 1) {
        const result = await createLoan(books[0].id, users[0].id);
        if (result.success) {
          return new Response(
            JSON.stringify({
              role: "assistant",
              content: `✅ **Empréstimo criado com sucesso!**

                📚 **Detalhes do empréstimo:**
                - **Livro:** ${books[0].title} (${books[0].author})
                - **Usuário:** ${users[0].full_name}
                - **Data de devolução:** ${formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())}
                - **ID do empréstimo:** \`${result.loanId}\`

O livro foi registrado como emprestado e sua disponibilidade foi atualizada no sistema.`,
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        }
      }
    }

    const geminiMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    if (geminiMessages.length === 0 || geminiMessages[0].role !== "model") {
      geminiMessages.unshift({ role: "model", parts: [{ text: systemPrompt }] });
    }

    const tools = [
      {
        functionDeclarations: [
          {
            name: "addBook",
            description: "Adicionar um novo livro ao banco de dados da biblioteca ou atualizar um existente",
            parameters: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING", description: "ID do livro (apenas para atualizações, omitir para novos livros)" },
                title: { type: "STRING", description: "Título do livro" },
                author: { type: "STRING", description: "Autor do livro" },
                isbn: { type: "STRING", description: "ISBN do livro (máximo 13 caracteres)" },
                stock: { type: "INTEGER", description: "Quantidade total em estoque" },
                available: { type: "INTEGER", description: "Quantidade disponível (deve ser <= estoque)" },
              },
              required: ["title", "author", "isbn", "stock", "available"],
            },
            
          },
          {
            name: "deleteBook",
            description: "Excluir um livro do banco de dados da biblioteca",
            parameters: {
              type: "OBJECT",
              properties: { id: { type: "STRING", description: "ID do livro a ser excluído" } },
              required: ["id"],
            },
          },
          {
            name: "searchBooks",
            description: "Pesquisar livros no banco de dados da biblioteca",
            parameters: {
              type: "OBJECT",
              properties: { query: { type: "STRING", description: "Consulta de pesquisa (título, autor ou ISBN)" } },
              required: ["query"],
            },
          },
          {
            name: "searchAvailableBooks",
            description: "Pesquisar apenas livros disponíveis no banco de dados da biblioteca",
            parameters: {
              type: "OBJECT",
              properties: { query: { type: "STRING", description: "Consulta de pesquisa (título, autor ou ISBN)" } },
              required: ["query"],
            },
          },
          {
            name: "searchUsers",
            description: "Pesquisar usuários pelo nome",
            parameters: {
              type: "OBJECT",
              properties: { query: { type: "STRING", description: "Nome ou parte do nome do usuário" } },
              required: ["query"],
            },
          },
          {
            name: "createLoan",
            description: "Criar um novo empréstimo de livro",
            parameters: {
              type: "OBJECT",
              properties: {
                bookId: { type: "STRING", description: "ID do livro a ser emprestado" },
                userId: { type: "STRING", description: "ID do usuário que está pegando o livro emprestado" },
                dueDate: { type: "STRING", description: "Data de devolução prevista (formato ISO, opcional)" },
              },
              required: ["bookId", "userId"],
            },
           
          },
          {
            name: "checkLoans",
            description: "Verificar empréstimos por usuário ou livro",
            parameters: {
              type: "OBJECT",
              properties: {
                userId: { type: "STRING", description: "ID do usuário para filtrar empréstimos (opcional)" },
                bookId: { type: "STRING", description: "ID do livro para filtrar empréstimos (opcional)" },
              },
            },
          },
        ],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_GENERATIVE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiMessages,
          tools,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na resposta do Gemini:", errorText);
      return new Response(JSON.stringify({ error: `Erro na API do Gemini: ${response.status}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: GeminiResponse = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      const parts = candidate.content.parts;

      const functionCallPart = parts.find((part) => part.functionCall);

      if (functionCallPart && functionCallPart.functionCall) {
        const { name, args } = functionCallPart.functionCall;
        let functionResponse = "";

        switch (name) {
          case "addBook": {
            const validation = validateBookData({
              title: args.title as string,
              author: args.author as string,
              isbn: args.isbn as string,
              stock: args.stock as number,
              available: args.available as number,
            });

            if (!validation.isValid) {
              return new Response(
                JSON.stringify({ role: "assistant", content: `Não foi possível adicionar o livro: ${validation.error}` }),
                { headers: { "Content-Type": "application/json" } },
              );
            }

            const formData = new FormData();
            if (args.id) formData.append("id", args.id as string);
            formData.append("title", args.title as string);
            formData.append("author", args.author as string);
            formData.append("isbn", args.isbn as string);
            formData.append("stock", (args.stock as number).toString());
            formData.append("available", (args.available as number).toString());

            try {
              await handleSubmitBook(formData);
              functionResponse = `✅ Livro "${args.title}" ${args.id ? "atualizado" : "adicionado"} com sucesso no banco de dados.\n\n📚 **Detalhes do livro:**\n- **Título:** ${args.title}\n- **Autor:** ${args.author}\n- **ISBN:** ${args.isbn}\n- **Estoque:** ${args.stock}\n- **Disponível:** ${args.available}`;
            } catch (error) {
              console.error("Erro ao salvar livro:", error);
              return new Response(
                JSON.stringify({
                  role: "assistant",
                  content: `❌ Erro ao salvar o livro. Verifique se o ISBN tem no máximo 13 caracteres e se todos os campos estão preenchidos corretamente.`,
                }),
                { headers: { "Content-Type": "application/json" } },
              );
            }
            break;
          }
          case "deleteBook": {
            try {
              await handleDeleteBook(args.id as string);
              functionResponse = `✅ Livro com ID ${args.id} foi excluído com sucesso.`;
            } catch (error) {
              console.error("Erro ao excluir livro:", error);
              return new Response(
                JSON.stringify({
                  role: "assistant",
                  content: `❌ Erro ao excluir o livro. Verifique se o ID está correto e se o livro não possui empréstimos ativos.`,
                }),
                { headers: { "Content-Type": "application/json" } },
              );
            }
            break;
          }
          case "searchBooks": {
            const supabase = await createClient();
          
            // Obter o library_id do usuário autenticado
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
              return new Response(
                JSON.stringify({ role: "assistant", content: "❌ Usuário não autenticado" }),
                { headers: { "Content-Type": "application/json" } },
              );
            }
          
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("library_id")
              .eq("id", user.id)
              .single();
          
            if (userError || !userData?.library_id) {
              return new Response(
                JSON.stringify({ role: "assistant", content: "❌ Usuário não está vinculado a uma biblioteca" }),
                { headers: { "Content-Type": "application/json" } },
              );
            }
          
            const libraryId = userData.library_id;
          
            const { data: books, error } = await supabase
              .from("books")
              .select("id, title, author, isbn, stock, available")
              .eq("library_id", libraryId) // Filtro por library_id
              .or(`title.ilike.%${args.query}%,author.ilike.%${args.query}%,isbn.ilike.%${args.query}%`)
              .limit(10);
          
            if (error) throw new Error(`Erro ao pesquisar livros: ${error.message}`);
          
            functionResponse = books.length === 0
              ? `📚 Nenhum livro encontrado com "${args.query}" na sua biblioteca.`
              : `📚 **Encontrados ${books.length} livros com "${args.query}" na sua biblioteca:**\n\n${books
                  .map((book, index) => `${index + 1}. **${book.title}** - ${book.author}\n📖 ID: \`${book.id}\`\n📕 ISBN: ${book.isbn}\n📊 Estoque: ${book.stock} | Disponível: ${book.available}`)
                  .join("\n\n")}`;
            break;
          }
          
          case "searchAvailableBooks": {
            const supabase = await createClient();
          
            // Obter o library_id do usuário autenticado
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
              return new Response(
                JSON.stringify({ role: "assistant", content: "❌ Usuário não autenticado" }),
                { headers: { "Content-Type": "application/json" } },
              );
            }
          
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("library_id")
              .eq("id", user.id)
              .single();
          
            if (userError || !userData?.library_id) {
              return new Response(
                JSON.stringify({ role: "assistant", content: "❌ Usuário não está vinculado a uma biblioteca" }),
                { headers: { "Content-Type": "application/json" } },
              );
            }
          
            const libraryId = userData.library_id;
          
            const { data: books, error } = await supabase
              .from("books")
              .select("id, title, author, isbn, stock, available")
              .eq("library_id", libraryId) // Filtro por library_id
              .or(`title.ilike.%${args.query}%,author.ilike.%${args.query}%,isbn.ilike.%${args.query}%`)
              .gt("available", 0)
              .limit(10);
          
            if (error) throw new Error(`Erro ao pesquisar livros disponíveis: ${error.message}`);
          
            functionResponse = books.length === 0
              ? `📚 Nenhum livro disponível encontrado com "${args.query}" na sua biblioteca.`
              : `📚 **Encontrados ${books.length} livros disponíveis com "${args.query}" na sua biblioteca:**\n\n${books
                  .map((book, index) => `${index + 1}. **${book.title}** - ${book.author}\n📖 ID: \`${book.id}\`\n📕 ISBN: ${book.isbn}\n📊 Disponível: ${book.available} de ${book.stock}`)
                  .join("\n\n")}`;
            break;
          }
          case "searchUsers": {
            const result = await searchUsers(args.query as string);
            if (!result.success) {
              return new Response(JSON.stringify({ role: "assistant", content: `❌ ${result.message}` }), {
                headers: { "Content-Type": "application/json" },
              });
            }
          
            functionResponse = !result.users || result.users.length === 0
              ? `👤 Nenhum usuário encontrado com o nome "${args.query}".`
              : `👤 **Encontrados ${result.users.length} usuários com o nome "${args.query}":**\n\n${result.users
                  .map((user, index) => 
                    `${index + 1}. **${user.full_name}**\n📧 Email: ${user.email || "Não informado"}\n🏫 Turma: ${user.class || "Não especificada"}\n📚 Série: ${user.grade || "Não especificada"}\n🔑 ID: \`${user.id}\``
                  )
                  .join("\n\n")}`;
            break;
          }
          case "createLoan": {
            const result = await createLoan(args.bookId as string, args.userId as string, args.dueDate as string | undefined);
            if (!result.success) {
              return new Response(JSON.stringify({ role: "assistant", content: `❌ ${result.message}` }), {
                headers: { "Content-Type": "application/json" },
              });
            }

            const dueDate = args.dueDate ? new Date(args.dueDate as string) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
            functionResponse = `✅ **Empréstimo criado com sucesso!**\n\n📚 **Detalhes do empréstimo:**\n- **Livro:** ${result.bookTitle || args.bookId}\n- **Usuário:** ${result.userName || args.userId}\n- **Data de devolução:** ${dueDate.toLocaleDateString("pt-BR")}\n- **ID do empréstimo:** \`${result.loanId}\`\n\nO livro foi registrado como emprestado e sua disponibilidade foi atualizada no sistema.`;
            break;
          }
          case "checkLoans": {
            const result = await checkLoans({ userId: args.userId as string | undefined, bookId: args.bookId as string | undefined });
            if (!result.success) {
              return new Response(JSON.stringify({ role: "assistant", content: `❌ ${result.message}` }), {
                headers: { "Content-Type": "application/json" },
              });
            }

            functionResponse = !result.loans || result.loans.length === 0
              ? `📚 Nenhum empréstimo encontrado com os critérios especificados.`
              : `📚 **Empréstimos encontrados (${result.loans.length}):**\n\n${result.loans
                  .map((loan, index) => {
                    const bookTitle = loan.books?.title || "Livro desconhecido";
                    const userName = loan.users?.full_name || "Usuário desconhecido";
                    return `${index + 1}. **${bookTitle}**\n👤 Usuário: ${userName}\n📅 Data do empréstimo: ${formatDate(loan.created_at)}\n📅 Data de devolução: ${formatDate(loan.due_date)}\n📊 Status: ${formatLoanStatus(loan.status)}\n🆔 ID: \`${loan.id}\``;
                  })
                  .join("\n\n")}`;
            break;
          }
        }

        return new Response(JSON.stringify({ role: "assistant", content: functionResponse }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const textPart = parts.find((part) => part.text);
      if (textPart && textPart.text) {
        return new Response(JSON.stringify({ role: "assistant", content: textPart.text }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ role: "assistant", content: "Desculpe, não consegui processar sua solicitação." }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro ao processar a requisição:", error);
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: `❌ Erro: ${error instanceof Error ? error.message : "Ocorreu um erro desconhecido"}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}