
  import { createClient } from "@/lib/supabase/server";
  import { handleDeleteBook, handleSubmitBook } from "@/app/(admin)/admin/books/actions";
  import { generateText, tool } from "ai";
  import { google } from "@ai-sdk/google";
  import { z } from "zod";
  import { createLoanAction, renewLoanAction, returnLoanAction, searchUsersAction } from "./actions";
  import nodemailer from "nodemailer";

  export const maxDuration = 60;

  // Interface for book data used in addMultipleBooks
  interface BookData {
    title: string;
    author: string;
    isbn?: string;
    stock: number;
    available: number;
  }

  // Interface for loan data in listRecentLoans
  interface Loan {
    id: string;
    created_at: string;
    due_date: string;
    status: string;
    books: { title: string } | null;
    users: { full_name: string } | null;
  }

  const systemPrompt = `
  Você é a Biblioteca AI 📚, um assistente inteligente especializado no gerenciamento de bibliotecas digitais.
  Seu papel é ajudar os administradores com tarefas como adicionar livros (individualmente ou em massa via Excel), excluir livros, gerenciar empréstimos e buscar informações.

  **Importante sobre Adição em Massa (Excel):**
  1. Primeiro, peça ao usuário para usar o botão de upload (ícone de clipe/nuvem) para enviar o arquivo Excel.
  2. Após o processamento do arquivo, o sistema informará quantos livros são válidos e se há erros.
  3. Pergunte explicitamente ao usuário se ele deseja confirmar a adição dos livros válidos.
  4. SOMENTE QUANDO o usuário confirmar (responder "sim", "confirmar", etc.), use a ferramenta 'addMultipleBooks' para adicioná-los. NÃO use a ferramenta antes da confirmação explícita.
  5. Se houver erros no arquivo, informe o usuário e NÃO prossiga com a adição até que um arquivo corrigido seja enviado.

  Se o usuário perguntar sobre listar livros, chame a ferramenta 'listBooks' para listar os livros.

  Seja claro, educado e objetivo.
  Explique os passos quando necessário e sempre valide se o usuário tem as informações corretas (como IDs ou nomes completos).

  Quando for necessário ID de algum item e o usuário fornecer apenas o nome ou descrição, ofereça ajuda para encontrar o ID correto antes de prosseguir.

  Se o usuário não fornecer um ID válido, forneça ajuda para encontrar o ID correto antes de prosseguir.
  ⚠️ Quando usar ferramentas que retornam HTML (como tabelas), envie apenas o HTML cru. Não escreva introduções como "Aqui está" ou "Veja abaixo". E não use cercas de código.

  No caso, se o usuário não fornecer assunto do email, crie um baseado no conteúdo do email, mas sempre valide com o usuário se o assunto está correto. (Não pergunte, faça direto)

  ### **Responsabilidades Principais**
  1. **Adicionar Livros**
   - **Individual**: Use a ferramenta addBook para adicionar um único livro. Valide que 'available <= stock' e que o ISBN, se fornecido, tenha até 13 caracteres.
   - **Em Massa (Excel)**:
     - Solicite o upload do arquivo Excel via botão de upload (ícone de clipe/nuvem).
     - Após processamento, informe o número de livros válidos e erros, listando até 5 erros específicos (ex.: "Linha 2: ISBN inválido").
     - **Peça confirmação explícita** (ex.: "sim", "confirmar") antes de usar addMultipleBooks. Não execute a ferramenta sem confirmação.
     - Se houver erros, oriente o usuário a corrigir o arquivo e reenviar.

     2. **Excluir Livros**
   - Use deleteBook com o ID do livro. Se o usuário fornecer apenas o título, use findBookByTitle para localizar o ID e confirme com o usuário.

   3. **Gerenciar Empréstimos**
   - Para criar, renovar ou devolver empréstimos (\`createLoan\`, \`renewLoan\`, \`returnLoan\`), valide IDs de usuário e livro. Se fornecidos nomes, use \`searchUsers\` ou \`findBookByTitle\` para obter IDs.
   - Para datas (ex.: \`dueDate\`), exija o formato AAAA-MM-DD. Se o usuário usar outro formato (ex.: "20 de junho de 2025"), peça para corrigir.

4. **Listar Informações**
   - Para listar livros ou empréstimos (\`listBooks\`, \`listRecentLoans\`), retorne tabelas HTML com classes CSS consistentes (ex.: \`table\`, \`border\`, \`px-4\`, \`py-2\`).
   - Se não houver dados, retorne uma mensagem clara: \`<p class="text-gray-600">Nenhum resultado encontrado.</p>\`.

5. **Relatórios e Emails**
   - Para relatórios (\`generateLoanReport\`), forneça o link do PDF diretamente no formato: \`<a href="[URL]" target="_blank" class="text-blue-500 hover:text-blue-600 underline">Baixar Relatório</a>\`.
   - Para emails (\`sendCustomEmail\`), gere um assunto baseado no conteúdo se não fornecido, mas valide com o usuário (ex.: "Confirme o assunto: [sugestão]"). Use HTML simples para o corpo do email.

---

### **Instruções Gerais**
- **Validação de Entrada**:
  - Sempre valide IDs, nomes e datas antes de executar ferramentas. Exemplo: se o usuário fornecer "Dom Quixote" ao invés de um ID, use \`findBookByTitle\` e pergunte: "Você quis dizer o livro com ID [ID]? Confirme."
  - Para datas inválidas, responda: "Por favor, use o formato AAAA-MM-DD (ex.: 2025-06-20)."

- **Formatação de Respostas**:
  - **Tabelas HTML**: Use \`<table class="w-full text-sm border-collapse bg-white shadow-sm rounded-lg" aria-label="[descrição]">\` com \`<th>\` e \`<td>\` estilizados com \`border\`, \`px-4\`, \`py-2\`. Não adicione texto introdutório como "Aqui está a tabela".
  - **Mensagens de Erro**: Use o formato: \`<div class="p-4 rounded-lg bg-red-50 border border-red-200 shadow-sm">...\</div>\`. Exemplo: "❌ Livro não encontrado. Use 'listar livros' para ver os IDs disponíveis."
  - **Confirmações**: Para ações críticas (ex.: adicionar múltiplos livros), peça confirmação clara: "Confirme com 'sim' ou 'confirmar' para prosseguir."

- **Tom e Clareza**:
  - Seja amigável, mas direto. Exemplo: "📚 Encontrei 3 livros. Qual ID você quer usar?" ao invés de respostas genéricas.
  - Evite respostas vagas. Se a solicitação for ambígua, pergunte: "Pode esclarecer? Exemplo: 'adicionar livro' ou 'listar empréstimos'."

- **Limitações**:
  - Não execute ações sem confirmação explícita do usuário em casos críticos (ex.: \`addMultipleBooks\`, \`deleteBook\`.
  - Não retorne cercas de código (\`\`\`) ou introduções desnecessárias em respostas HTML.

---

### **Exemplos de Respostas**
1. **Adição em Massa**:
   - Após upload: \`<p>Arquivo processado: 10 livros válidos, 2 erros (Linha 3: ISBN duplicado, Linha 5: Estoque inválido). Deseja adicionar os 10 livros válidos? Responda "sim" ou "confirmar".</p>\`
   - Após confirmação: \`✅ 10 livros adicionados com sucesso. 📚\`

2. **Erro de ID**:
   - \`❌ ID de livro inválido. Use "listar livros" para encontrar o ID correto.\`

3. **Tabela de Empréstimos**:
   - \`<table class="w-full text-sm border-collapse bg-white shadow-sm rounded-lg" aria-label="Lista de empréstimos recentes">...\</table>\`

4. **Data Inválida**:
   - \`❌ Data inválida. Use o formato AAAA-MM-DD (ex.: 2025-06-20).\`

  Quando retornar conteúdo HTML, envie **somente** o HTML cru, sem cercas de código e sem a palavra “html”.

  Caso o usuário informe uma data em formato incorreto (ex: "20 de junho de 2025"), oriente para usar o formato AAAA-MM-DD (ex: 2025-06-20).

  
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

    const { messages, bookDataForTool }: {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      bookDataForTool?: BookData[];
    } = await req.json();

    const messagesForAI = messages;

    try {
      const { text, toolResults } = await generateText({
        model: google("gemini-1.5-flash"),
        maxSteps: 6,
        messages: [
          { role: "system", content: systemPrompt },
          ...messagesForAI,
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
                const message = err instanceof Error && err.message?.includes("duplicate key value violates unique constraint") && err.message?.includes("books_isbn_key")
                  ? "Já existe um livro com este ISBN."
                  : err instanceof Error && err.message?.includes('violates check constraint "books_available_check"')
                  ? "A quantidade disponível não pode ser maior que o estoque."
                  : "Ocorreu um erro.";
                return `❌ Erro ao adicionar livro: ${message}`;
              }
            },
          }),


         listRecentBooks: tool({
          description: 'LIstar os 5 livros mais recentes em forma de tabela HTML',
          parameters: z.object({}),
          execute: async () => {
            try {
              const supabase = await createClient();
              const { data, error } = await supabase
                .from("books")
                .select("id, title, author, created_at")
                .order("created_at", { ascending: false })
                .limit(5);
        
              if (error) throw error;
              if (!data || data.length === 0) {
                return `<p class=\"text-gray-600\">Nenhum livro encontrado.</p>`;
              }
        
              let html = `
        <table class=\"w-full text-sm border-collapse bg-white shadow-sm rounded-lg\">
          <thead class=\"bg-gray-50\">
            <tr>
              <th class=\"border px-4 py-2 text-left font-medium\">ID</th>
              <th class=\"border px-4 py-2 text-left font-medium\">Título</th>
              <th class=\"border px-4 py-2 text-left font-medium\">Autor</th>
              <th class=\"border px-4 py-2 text-left font-medium\">Data Cadastro</th>
            </tr>
          </thead>
          <tbody>
        `;
        
              for (const book of data) {
                html += `
            <tr class=\"hover:bg-gray-50\">
              <td class=\"border px-4 py-2\">${book.id}</td>
              <td class=\"border px-4 py-2\">${book.title.replace(/</g, "&lt;")}</td>
              <td class=\"border px-4 py-2\">${book.author.replace(/</g, "&lt;")}</td>
              <td class=\"border px-4 py-2\">${new Date(book.created_at).toLocaleDateString("pt-BR")}</td>
            </tr>
        `;
              }
        
              html += `
          </tbody>
        </table>
        `;
              return html.trim();
            } catch (err) {
              console.error("Erro ao listar livros:", err);
              return `<div class=\"p-4 rounded-lg bg-red-50 border border-red-200 shadow-sm\">❌ Erro ao listar livros.</div>`;
            }
          },
        }),

          listRecentLoans: tool({
            description: "Listar os 5 empréstimos mais recentes em forma de tabela HTML",
            parameters: z.object({}),
            execute: async () => {
              try {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuário não autenticado");

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
                if (!loans || loans.length === 0) return `<p>Nenhum empréstimo recente encontrado.</p>`;

                let html = `<table class="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th class="border px-2 py-1">ID</th>
                      <th class="border px-2 py-1">Livro</th>
                      <th class="border px-2 py-1">Usuário</th>
                      <th class="border px-2 py-1">Data Empréstimo</th>
                      <th class="border px-2 py-1">Vencimento</th>
                      <th class="border px-2 py-1">Status</th>
                    </tr>
                  </thead>
                  <tbody>`;

                for (const loan of loans) {
                  html += `
                    <tr>
                      <td class="border px-2 py-1">${loan.id}</td>
                      <td class="border px-2 py-1">${loan.books?.title ?? "-"}</td>
                      <td class="border px-2 py-1">${loan.users?.full_name ?? "-"}</td>
                      <td class="border px-2 py-1">${new Date(loan.created_at).toLocaleDateString("pt-BR")}</td>
                      <td class="border px-2 py-1">${new Date(loan.due_date).toLocaleDateString("pt-BR")}</td>
                      <td class="border px-2 py-1">${loan.status}</td>
                    </tr>`;
                }

                html += `</tbody></table>`;
                return html.trim();
              } catch (err) {
                console.error("Erro ao listar empréstimos:", err);
                return "❌ Erro ao listar empréstimos.";
              }
            },
          }),

       

          addMultipleBooks: tool({
            description: "Adicionar MÚLTIPLOS livros à biblioteca APÓS o usuário confirmar explicitamente a partir de um arquivo Excel processado. Requer a lista de livros válidos.",
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
                  const message = err instanceof Error && err.message?.includes("duplicate key value violates unique constraint") && err.message?.includes("books_isbn_key")
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

          generateLoanReport: tool({
            description: "Gerar um relatório PDF dos empréstimos atuais da biblioteca",
            parameters: z.object({}),
            execute: async () => {
              try {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  throw new Error("Usuário não autenticado");
                }

                const { data: userData, error: userError } = await supabase
                  .from("users")
                  .select("library_id")
                  .eq("id", user.id)
                  .single();

                if (userError || !userData || !userData.library_id) {
                  throw new Error("Não foi possível identificar a biblioteca do usuário");
                }

                const libraryId = userData.library_id;
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
                const reportUrl = `${siteUrl}/api/generate-report?libraryId=${libraryId}&type=full&format=pdf`;

                try {
                  const checkResponse = await fetch(`${siteUrl}/api/generate-report?libraryId=${libraryId}&type=full&format=json`);
                  if (!checkResponse.ok) {
                    const errorData = await checkResponse.json();
                    throw new Error(errorData.error || "Falha ao verificar biblioteca");
                  }
                  return `Relatório de empréstimos gerado com sucesso! Para visualizar, acesse este link: ${reportUrl}`;
                } catch (fetchErr) {
                  console.error("Erro ao verificar biblioteca:", fetchErr);
                  return `❌ Erro ao verificar biblioteca: ${fetchErr instanceof Error ? fetchErr.message : "Erro desconhecido"}`;
                }
              } catch (err) {
                console.error("Erro ao preparar relatório:", err);
                return `❌ Erro ao preparar relatório`;
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

          listBooks: tool({
            description: "Listar todos os livros cadastrados em forma de tabela",
            parameters: z.object({}),
            execute: async () => {
              const supabase = await createClient();
              const { data, error } = await supabase
                .from("books")
                .select("id, title, author")
                .order("created_at", { ascending: false });
          
              if (error) throw error;
              if (!data || data.length === 0) {
                return `<p class="text-gray-600">📚 Nenhum livro encontrado.</p>`;
              }
          
              let html = `
                <table class="w-full text-sm border-collapse bg-white shadow-sm rounded-lg">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">ID</th>
                      <th class="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Título</th>
                      <th class="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Autor</th>
                    </tr>
                  </thead>
                  <tbody>
              `;
          
              for (const book of data) {
                html += `
                  <tr class="hover:bg-gray-50">
                    <td class="border border-gray-200 px-4 py-2 text-gray-800">${book.id}</td>
                    <td class="border border-gray-200 px-4 py-2 text-gray-800">${book.title.replace(/</g, "&lt;")}</td>
                    <td class="border border-gray-200 px-4 py-2 text-gray-800">${book.author.replace(/</g, "&lt;")}</td>
                  </tr>
                `;
              }
          
              html += `</tbody></table>`;
              return html;
            },
          }),

          findBookByTitle: tool({
            description: "Encontrar livros pelo título",
            parameters: z.object({ title: z.string() }),
            execute: async ({ title }) => {
              try {
                const supabase = await createClient();
                const { data, error } = await supabase
                  .from("books")
                  .select("id, title, author")
                  .ilike("title", `%${title}%`)
                  .limit(5);

                if (error) throw error;
                if (!data || data.length === 0) return "📚 Nenhum livro encontrado com esse título.";
                return data.map(book => `ID: ${book.id} - 📚 ${book.title} - ✍️ ${book.author}`).join("\n");
              } catch (err) {
                console.error("Erro ao buscar livros:", err);
                return "❌ Erro ao buscar livros.";
              }
            },
          }),

          searchUsers: tool({
            description: "Buscar usuários por nome",
            parameters: z.object({ query: z.string() }),
            execute: async ({ query }) => {
              try {
                const users = await searchUsersAction(query);
                if (!users || users.length === 0) return `❌ Nenhum usuário encontrado.`;
                return users.map(u => `👤 ${u.full_name} (${u.email})`).join("\n");
              } catch (err) {
                console.error("Erro ao buscar usuários:", err);
                return "❌ Erro ao buscar usuários.";
              }
            },
          }),

          createLoan: tool({
            description: "Criar um empréstimo de livro",
            parameters: z.object({
              bookId: z.string(),
              userId: z.string(),
              dueDate: z.string().optional(),
            }),
            execute: async ({ bookId, userId, dueDate }) => {
              try {
                const result = await createLoanAction(bookId, userId, dueDate);
                return result.success
                  ? `✅ Empréstimo criado com sucesso! ID: ${result.loanId}`
                  : `❌ ${result.message}`;
              } catch (err) {
                console.error("Erro ao criar empréstimo:", err);
                return `❌ Erro ao criar empréstimo`;
              }
            },
          }),

          renewLoan: tool({
            description: "Renovar um empréstimo de livro",
            parameters: z.object({
              userName: z.string(),
              bookTitle: z.string(),
              specificDueDate: z.string().optional(),
            }),
            execute: async ({ userName, bookTitle, specificDueDate }) => {
              try {
                let parsedDate: string | undefined = undefined;
                if (specificDueDate) {
                  const { text: parsed } = await generateText({
                    model: google("gemini-1.5-flash"),
                    messages: [
                      { role: "system", content: "Converta a data fornecida para o formato AAAA-MM-DD. Se não conseguir, diga apenas: INVALIDO." },
                      { role: "user", content: `Converta esta data: "${specificDueDate}"` },
                    ],
                    maxSteps: 3,
                  });
                  if (parsed.includes("INVALIDO")) {
                    return `❌ Não entendi a data informada. Por favor, use expressões como 'sexta-feira', 'amanhã' ou informe no formato AAAA-MM-DD (ex: 2025-06-20).`;
                  } else {
                    parsedDate = parsed.trim();
                  }
                }
                const result = await renewLoanAction(userName, bookTitle, parsedDate);
                return result.success
                  ? `✅ Empréstimo renovado com sucesso! Nova data de devolução: ${parsedDate || "padrão de 14 dias"}`
                  : `❌ ${result.message}`;
              } catch (err) {
                console.error("Erro ao renovar empréstimo:", err);
                return `❌ Erro ao renovar empréstimo`;
              }
            },
          }),

          returnLoan: tool({
            description: "Devolver um empréstimo de livro",
            parameters: z.object({
              userName: z.string(),
              bookTitle: z.string(),
            }),
            execute: async ({ userName, bookTitle }) => {
              try {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuário não autenticado");

                const { data: userData } = await supabase
                  .from("users")
                  .select("library_id")
                  .eq("id", user.id)
                  .single();
                if (!userData?.library_id) throw new Error("Usuário sem biblioteca");

                const { data: foundUsers } = await supabase
                  .from("users")
                  .select("id")
                  .eq("library_id", userData.library_id)
                  .ilike("full_name", `%${userName}%`)
                  .limit(2);
                if (!foundUsers || foundUsers.length !== 1) {
                  return "❌ Usuário não encontrado ou múltiplos encontrados.";
                }

                const { data: books } = await supabase
                  .from("books")
                  .select("id")
                  .eq("library_id", userData.library_id)
                  .ilike("title", `%${bookTitle}%`)
                  .limit(2);
                if (!books || books.length !== 1) {
                  return "❌ Livro não encontrado ou múltiplos encontrados.";
                }

                const { data: loanData } = await supabase
                  .from("loans")
                  .select("id")
                  .eq("user_id", foundUsers[0].id)
                  .eq("book_id", books[0].id)
                  .eq("library_id", userData.library_id)
                  .eq("status", "active")
                  .single();
                if (!loanData) {
                  return "❌ Empréstimo ativo não encontrado.";
                }

                const result = await returnLoanAction(loanData.id);
                return result.success ? `✅ Empréstimo devolvido com sucesso!` : `❌ ${result.message}`;
              } catch (err) {
                console.error("Erro ao devolver empréstimo:", err);
                return `❌ Erro ao devolver empréstimo: ${err instanceof Error ? err.message : "Erro desconhecido"}`;
              }
            },
          }),
        },
      });

      let responseContent = text;
      if (toolResults && toolResults.length > 0) {
        responseContent = toolResults.map(result => result.result).join("\n");
      }
      if (!responseContent) {
        responseContent = "Não consegui processar sua solicitação ou gerar uma resposta.";
        console.warn("generateText returned no text and no tool results.");
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