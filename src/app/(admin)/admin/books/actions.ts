"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function getUserLibraryId() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  // Buscar o library_id do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('library_id')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.library_id) {
    throw new Error("Usuário não está vinculado a uma biblioteca")
  }

  return userData.library_id
}

export async function handleSubmitBook(formData: FormData) {
  const supabase = await createClient()
  
  // Pegar o library_id do usuário atual
  const libraryId = await getUserLibraryId()
  
  const bookId = formData.get("id") as string | null
  const title = formData.get("title") as string
  const author = formData.get("author") as string
  const isbn = formData.get("isbn") as string
  
  // Validar stock
  const stockStr = formData.get("stock")
  if (!stockStr || typeof stockStr !== "string") {
    throw new Error("O estoque deve ser um número inteiro válido.")
  }
  const stock = parseInt(stockStr, 10)
  if (isNaN(stock) || stock < 0) {
    throw new Error("O estoque não pode ser negativo.")
  }

  // Validar available
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
      // Verificar se o livro pertence à biblioteca do usuário
      const { data: existingBook } = await supabase
        .from("books")
        .select("library_id")
        .eq("id", bookId)
        .single()

      if (existingBook?.library_id !== libraryId) {
        throw new Error("Você não tem permissão para editar este livro")
      }

      // Atualizar livro
      const { error: updateError } = await supabase
        .from("books")
        .update({
          title,
          author,
          isbn,
          stock,
          available,
          updated_at: new Date().toISOString()
        })
        .eq("id", bookId)
        .eq("library_id", libraryId) // Garantir que o livro pertence à biblioteca

      if (updateError) throw updateError
    } else {
      // Inserir novo livro
      const { error: insertError } = await supabase
        .from("books")
        .insert({
          title,
          author,
          isbn,
          stock,
          available,
          library_id: libraryId // Usar o library_id do usuário
        })

      if (insertError) throw insertError
    }
    
    revalidatePath("/admin/books")
  } catch (error) {
    console.error('Erro ao salvar livro:', error)
    throw new Error("Erro ao salvar livro")
  }
}

export async function handleDeleteBook(bookId: string) {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  try {
    // Verificar se o livro pertence à biblioteca do usuário
    const { data: book } = await supabase
      .from("books")
      .select("library_id")
      .eq("id", bookId)
      .single()

    if (book?.library_id !== libraryId) {
      throw new Error("Você não tem permissão para excluir este livro")
    }

    // Verificar se existem empréstimos ativos
    const { data: activeLoans, error: loansError } = await supabase
      .from("loans")
      .select("id")
      .eq("book_id", bookId)
      .eq("status", "active")
      .limit(1)

    if (loansError) throw loansError
    if (activeLoans && activeLoans.length > 0) {
      throw new Error("Não é possível excluir um livro com empréstimos ativos.")
    }

    // Verificar se existem reservas pendentes
    const { data: pendingReservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id")
      .eq("book_id", bookId)
      .eq("status", "pending")
      .limit(1)

    if (reservationsError) throw reservationsError
    if (pendingReservations && pendingReservations.length > 0) {
      throw new Error("Não é possível excluir um livro com reservas pendentes.")
    }

    // Excluir o livro
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId)
      .eq("library_id", libraryId) // Garantir que o livro pertence à biblioteca

    if (deleteError) throw deleteError
    
    revalidatePath("/admin/books")
  } catch (error) {
    console.error('Erro ao excluir livro:', error)
   throw new Error("Erro ao excluir livro")
  }
}
