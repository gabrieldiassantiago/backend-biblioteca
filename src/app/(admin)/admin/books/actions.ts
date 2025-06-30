"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Função auxiliar para obter o library_id do usuário autenticado
async function getUserLibraryId() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");

  const { data: userData } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();

    if (authError || !user) {
      console.log("Usuário não autenticado, redirecionando para login");
      redirect('/login');
    }//

  return userData?.library_id;
}


// Função para cadastrar ou atualizar um livro IA
export async function handleSubmitBook(formData: FormData) {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();

  const bookId = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const isbn = formData.get("isbn") as string;

  const stockStr = formData.get("stock");
  if (!stockStr || typeof stockStr !== "string") {
    throw new Error("O estoque deve ser um número inteiro válido.");
  }
  const stock = Number.parseInt(stockStr, 10);
  if (isNaN(stock) || stock < 0) {
    throw new Error("O estoque não pode ser negativo.");
  }

  const availableStr = formData.get("available");
  if (!availableStr || typeof availableStr !== "string") {
    throw new Error("A quantidade disponível deve ser um número inteiro válido.");
  }
  const available = Number.parseInt(availableStr, 10);
  if (isNaN(available) || available < 0) {
    throw new Error("A quantidade disponível não pode ser negativa.");
  }
  
  if (available > stock) {
    throw new Error("A quantidade disponível não pode ser maior que o estoque.");
  }

  try {
    if (bookId) {
      const { data: existingBook } = await supabase.from("books").select("library_id").eq("id", bookId).single();

      if (existingBook?.library_id !== libraryId) {
        throw new Error("Você não tem permissão para editar este livro");
      }

      const { error: updateError } = await supabase
        .from("books")
        .update({
          title,
          author,
          isbn,
          stock,
          available,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookId)
        .eq("library_id", libraryId);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("books").insert({
        title,
        author,
        isbn,
        stock,
        available,
        library_id: libraryId,
      });

      if (insertError) throw insertError;
    }

    revalidatePath("/admin/books");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Erro ao salvar livro:", error);
    throw new Error("Erro ao salvar livro");
  }
}

// Função para excluir um livro
export async function handleDeleteBook(bookId: string) {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();

  try {
    // Verifica se o livro pertence à biblioteca do usuário
    const { data: book } = await supabase.from("books").select("library_id").eq("id", bookId).single();
    if (book?.library_id !== libraryId) {
      throw new Error("Você não tem permissão para excluir este livro");
    }

    // Verifica empréstimos ativos
    const { data: activeLoans, error: loansError } = await supabase
      .from("loans")
      .select("id")
      .eq("book_id", bookId)
      .eq("status", "active")
      .limit(1);
  
    console.log("Resultado da consulta de empréstimos ativos:", { activeLoans, loansError });
    if (loansError) {
      console.error("Erro na consulta de empréstimos ativos:", loansError);
      throw new Error(`Erro ao verificar empréstimos ativos: ${loansError.message}`);
    }
    if (activeLoans && activeLoans.length > 0) {
      throw new Error("Não é possível excluir um livro com empréstimos ativos.");
    }
      
    // Exclui o livro
    const { error: deleteError } = await supabase.from("books").delete().eq("id", bookId).eq("library_id", libraryId);
    if (deleteError) throw deleteError;

    // Revalida os caminhos
    revalidatePath("/admin/books");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Erro ao excluir livro:", error);
    throw new Error("Erro ao excluir livro");
  }
}

// Interfaces para empréstimos recentes
interface RecentLoan {
  id: string;
  book: string;
  user: string;
  date: string;
  dueDate: string;
  status: string;
}

interface RawLoan {
  id: string;
  created_at: string;
  due_date: string;
  status: string;
  books: { title: string } | null;
  users: { full_name: string } | null;
}

// Função para obter empréstimos recentes
export async function getRecentLoans(): Promise<RecentLoan[]> {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();

  try {
    const { data, error } = await supabase
      .from("loans")
      .select(`
        id,
        created_at,
        due_date,
        status,
        books:book_id(title),
        users:user_id(full_name)
      `)
      .eq("library_id", libraryId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data as unknown as RawLoan[]).map((loan) => ({
      id: loan.id,
      book: loan.books?.title || "Livro desconhecido",
      user: loan.users?.full_name || "Usuário desconhecido",
      date: loan.created_at,
      dueDate: loan.due_date,
      status: loan.status,
    }));
  } catch (error) {
    console.error("Erro ao buscar empréstimos recentes:", error);
    throw new Error("Falha ao carregar empréstimos recentes");
  }
}
