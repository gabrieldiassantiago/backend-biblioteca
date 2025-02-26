"use server"

// Importa a função para criar um cliente Supabase no lado do servidor
import { createClient } from "@/lib/supabase/server"
// Importa a função para invalidar o cache de uma rota específica após alterações
import { revalidatePath } from "next/cache"

// Função assíncrona para obter o ID da biblioteca associada ao usuário autenticado
async function getUserLibraryId() {
  // Cria uma instância do cliente Supabase
  const supabase = await createClient()
  
  // Obtém os dados do usuário autenticado atual
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  // Se houver erro ou o usuário não estiver autenticado, lança uma exceção
  if (authError || !user) throw new Error("Usuário não autenticado")

  // Busca o `library_id` do usuário na tabela 'users' usando seu ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('library_id')
    .eq('id', user.id)
    .single()

  // Se houver erro ou o usuário não tiver um `library_id`, lança uma exceção
  if (userError || !userData?.library_id) {
    throw new Error("Usuário não está vinculado a uma biblioteca")
  }

  // Retorna o `library_id` do usuário
  return userData.library_id
}

// Função assíncrona para criar ou atualizar um livro na biblioteca do usuário
export async function handleSubmitBook(formData: FormData) {
  // Cria uma instância do cliente Supabase
  const supabase = await createClient()
  
  // Obtém o ID da biblioteca do usuário autenticado
  const libraryId = await getUserLibraryId()
  
  // Extrai os dados do formulário enviado
  const bookId = formData.get("id") as string | null // ID do livro (null se for novo)
  const title = formData.get("title") as string // Título do livro
  const author = formData.get("author") as string // Autor do livro
  const isbn = formData.get("isbn") as string // ISBN do livro
  
  // Validação do campo 'stock' (estoque total)
  const stockStr = formData.get("stock")
  if (!stockStr || typeof stockStr !== "string") {
    throw new Error("O estoque deve ser um número inteiro válido.")
  }
  const stock = parseInt(stockStr, 10)
  if (isNaN(stock) || stock < 0) {
    throw new Error("O estoque não pode ser negativo.")
  }

  // Validação do campo 'available' (quantidade disponível)
  const availableStr = formData.get("available")
  if (!availableStr || typeof availableStr !== "string") {
    throw new Error("A quantidade disponível deve ser um número inteiro válido.")
  }
  const available = parseInt(availableStr, 10)
  if (isNaN(available) || available < 0) {
    throw new Error("A quantidade disponível não pode ser negativa.")
  }
  if (available > stock) {
    throw new Error("A quantidade disponível não pode ser maior que o estoque.")
  }

  try {
    if (bookId) {
      // Caso seja uma edição (bookId existe), verifica se o livro pertence à biblioteca do usuário
      const { data: existingBook } = await supabase
        .from("books")
        .select("library_id")
        .eq("id", bookId)
        .single()

      if (existingBook?.library_id !== libraryId) {
        throw new Error("Você não tem permissão para editar este livro")
      }

      // Atualiza os dados do livro existente na tabela 'books'
      const { error: updateError } = await supabase
        .from("books")
        .update({
          title,
          author,
          isbn,
          stock,
          available,
          updated_at: new Date().toISOString() // Atualiza a data de modificação
        })
        .eq("id", bookId)
        .eq("library_id", libraryId) // Garante que o livro pertence à biblioteca do usuário

      if (updateError) throw updateError
    } else {
      // Caso seja um novo livro (sem bookId), insere um novo registro na tabela 'books'
      const { error: insertError } = await supabase
        .from("books")
        .insert({
          title,
          author,
          isbn,
          stock,
          available,
          library_id: libraryId // Associa o livro à biblioteca do usuário
        })

      if (insertError) throw insertError
    }
    
    // Invalida o cache da rota "/admin/books" para refletir as mudanças na UI
    revalidatePath("/admin/books")
  } catch (error) {
    // Loga o erro no servidor para depuração
    console.error('Erro ao salvar livro:', error)
    // Lança uma exceção genérica para ser tratada no frontend
    throw new Error("Erro ao salvar livro")
  }
}

// Função assíncrona para excluir um livro da biblioteca do usuário
export async function handleDeleteBook(bookId: string) {
  // Cria uma instância do cliente Supabase
  const supabase = await createClient()
  // Obtém o ID da biblioteca do usuário autenticado
  const libraryId = await getUserLibraryId()

  try {
    // Verifica se o livro pertence à biblioteca do usuário
    const { data: book } = await supabase
      .from("books")
      .select("library_id")
      .eq("id", bookId)
      .single()

    if (book?.library_id !== libraryId) {
      throw new Error("Você não tem permissão para excluir este livro")
    }

    // Verifica se há empréstimos ativos associados ao livro
    const { data: activeLoans, error: loansError } = await supabase
      .from("loans")
      .select("id")
      .eq("book_id", bookId)
      .eq("status", "active")
      .limit(1) // Basta encontrar um para bloquear a exclusão

    if (loansError) throw loansError
    if (activeLoans && activeLoans.length > 0) {
      throw new Error("Não é possível excluir um livro com empréstimos ativos.")
    }

    // Verifica se há reservas pendentes associadas ao livro
    const { data: pendingReservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id")
      .eq("book_id", bookId)
      .eq("status", "pending")
      .limit(1) // Basta encontrar uma para bloquear a exclusão

    if (reservationsError) throw reservationsError
    if (pendingReservations && pendingReservations.length > 0) {
      throw new Error("Não é possível excluir um livro com reservas pendentes.")
    }

    // Exclui o livro da tabela 'books'
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId)
      .eq("library_id", libraryId) // Garante que o livro pertence à biblioteca do usuário

    if (deleteError) throw deleteError
    
    // Invalida o cache da rota "/admin/books" para refletir a exclusão na UI
    revalidatePath("/admin/books")
  } catch (error) {
    // Loga o erro no servidor para depuração
    console.error('Erro ao excluir livro:', error)
    // Lança uma exceção genérica para ser tratada no frontend
    throw new Error("Erro ao excluir livro")
  }
}