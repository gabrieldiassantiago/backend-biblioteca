"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/app/lib/email-service";

// Interface para dados de atualização de empréstimo
interface LoanUpdateData {
  status: "pending" | "active" | "returned" | "overdue" | "rejected";
  updated_at: string;
  returned_at?: string | null;
  return_observation?: string;
}

// Interface para objeto de avaliação
interface Rating {
  rating: number | null;
}

// Recupera o ID da biblioteca do usuário autenticado
export async function getUserLibraryId() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.library_id) throw new Error("Usuário não vinculado a uma biblioteca");
  return userData.library_id;
}

// Atualiza o status de um empréstimo e grava avaliação se for devolução
export async function updateLoanStatus(
  loanId: string,
  newStatus: "pending" | "active" | "returned" | "overdue" | "rejected",
  formData?: FormData
) {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();

  // 1) Validação de existência e permissão
  const { data: loan, error: fetchError } = await supabase
    .from("loans")
    .select("library_id, status, book_id, user_id")
    .eq("id", loanId)
    .single();
  if (fetchError || !loan) throw new Error("Empréstimo não encontrado");
  if (loan.library_id !== libraryId) throw new Error("Você não tem permissão para atualizar este empréstimo");
  if (loan.status === newStatus) throw new Error(`Este empréstimo já está como "${newStatus}"`);

  // 2) Preparação dos dados de atualização
  const updateData: LoanUpdateData = { status: newStatus, updated_at: new Date().toISOString() };

  if (newStatus === "returned") {
    const dateField = formData?.get("returnDate")?.toString();
    updateData.returned_at = dateField
      ? new Date(dateField).toISOString()
      : new Date().toISOString();
    if (formData?.get("observation")) {
      updateData.return_observation = formData.get("observation")!.toString();
    }
  } else {
    updateData.returned_at = null;
  }

  // 3) Aplica atualização no empréstimo
  const { error: updErr } = await supabase
    .from("loans")
    .update(updateData)
    .eq("id", loanId);
  if (updErr) throw new Error("Falha ao atualizar empréstimo: " + updErr.message);

  // 4) Ajuste de estoque e envio de e-mails
  if (newStatus === "active" && loan.status === "pending") {
    // Reserva: decrementa available
    const { data: book1, error: bookErr1 } = await supabase
      .from("books")
      .select("available")
      .eq("id", loan.book_id)
      .single();
    if (bookErr1 || !book1) throw new Error("Livro não encontrado");
    if (book1.available <= 0) throw new Error("Livro não está mais disponível");

    const { error: stockErr1 } = await supabase
      .from("books")
      .update({ available: book1.available - 1, updated_at: new Date().toISOString() })
      .eq("id", loan.book_id);
    if (stockErr1) throw new Error("Erro ao atualizar estoque: " + stockErr1.message);

  } else if (newStatus === "returned" && ["active", "overdue"].includes(loan.status)) {
    // Devolução: incrementa available
    const { data: book2, error: bookErr2 } = await supabase
      .from("books")
      .select("available, stock")
      .eq("id", loan.book_id)
      .single();
    if (bookErr2 || !book2) throw new Error("Livro não encontrado");

    const newAvailable = Math.min(book2.available + 1, book2.stock);
    const { error: stockErr2 } = await supabase
      .from("books")
      .update({ available: newAvailable, updated_at: new Date().toISOString() })
      .eq("id", loan.book_id);
    if (stockErr2) throw new Error("Erro ao atualizar estoque: " + stockErr2.message);

    try {
      await sendEmail(loanId, "returnedLoan");
    } catch {
      // Silencia erros de email
    }
  }

  // 5) Insere avaliação na tabela ratings (opção B)
  if (newStatus === "returned" && formData?.get("rating")) {
    const ratingValue = Number(formData.get("rating"));
    const commentValue = formData.get("comment")?.toString() || null;

    const { error: ratingErr } = await supabase
      .from("ratings")
      .insert({ student_id: loan.user_id, rating: ratingValue, comment: commentValue });
    if (ratingErr) throw new Error("Falha ao gravar avaliação: " + ratingErr.message);
  }

  // 6) Revalida cache e retorna
  revalidatePath("/admin/loans");
  return { success: true, message: `Status atualizado para "${newStatus}" com sucesso!` };
}

// Estende o prazo de devolução
export async function extendLoanDueDate(loanId: string, formData: FormData) {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();
  const newDueDate = formData.get("dueDate") as string;
  if (!newDueDate) throw new Error("Data de devolução não fornecida");

  const { data: loan, error: fetchError } = await supabase
    .from("loans")
    .select("library_id, due_date, status")
    .eq("id", loanId)
    .single();
  if (fetchError || !loan) throw new Error("Empréstimo não encontrado");
  if (loan.library_id !== libraryId) throw new Error("Você não tem permissão para atualizar este empréstimo");

  const currentDue = new Date(loan.due_date).toISOString().split("T")[0];
  if (currentDue === newDueDate) throw new Error("A nova data é igual à atual");

  const today = new Date(); today.setHours(0,0,0,0);
  let statusAfter = loan.status;
  if (new Date(newDueDate) > today && loan.status === "overdue") statusAfter = "active";

  const { error: updErr } = await supabase
    .from("loans")
    .update({ due_date: newDueDate, status: statusAfter, updated_at: new Date().toISOString() })
    .eq("id", loanId);
  if (updErr) throw new Error("Falha ao estender prazo: " + updErr.message);

  try { await sendEmail(loanId, "updateLoan"); } catch {}
  revalidatePath("/admin/loans");
  return { success: true, message: "Prazo estendido com sucesso!" };
}

// Busca livros por título
export async function searchBooks(query: string) {
  try {
    const supabase = await createClient();
    const libraryId = await getUserLibraryId();
    if (!query || query.trim().length < 2) return [];

    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, available, stock")
      .eq("library_id", libraryId)
      .ilike("title", `%${query}%`)
      .order("title")
      .limit(10);
    if (error) throw new Error("Erro ao buscar livros: " + error.message);
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    return [];
  }
}
// Busca usuários por nome
export async function searchUsers(query: string) {
  try {
    const supabase = await createClient();
    const libraryId = await getUserLibraryId();
    if (!query || query.trim().length < 2) return [];

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        role,
        ratings!left(rating)
      `)
      .eq("library_id", libraryId)
      .eq("role", "student")
      .ilike("full_name", `%${query}%`)
      .order("full_name")
      .limit(10);

    if (error) throw new Error("Erro ao buscar usuários: " + error.message);

    // Process data to compute average_rating
    const processedData = data.map((user) => {
      const ratings = user.ratings
        .filter((r: Rating) => r.rating !== null)
        .map((r: Rating) => r.rating) as number[]; // Type assertion since filter removes null
      const average_rating =
        ratings.length > 0
          ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
          : 0;
      return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        average_rating,
      };
    });

    return processedData || [];
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
}

// Cria um novo empréstimo
export async function createNewLoan(bookId: string, userId: string) {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();

  // Verifica disponibilidade do livro
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("available, stock")
    .eq("id", bookId)
    .single();
  if (bookError || !book) throw new Error("Livro não encontrado");
  if (book.available <= 0 || book.stock <= 0) throw new Error("Livro não está disponível para empréstimo");

  // Verifica limite de empréstimos do usuário
  const { data: activeLoans, error: loansError } = await supabase
    .from("loans")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["pending", "active"]);
  if (loansError) throw new Error("Erro ao verificar empréstimos ativos: " + loansError.message);
  if (activeLoans?.length >= 3) throw new Error("Usuário já atingiu o limite de empréstimos pendentes ou ativos");

  // Cria empréstimo
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const { data: newLoan, error: insertError } = await supabase
    .from("loans")
    .insert({ user_id: userId, book_id: bookId, library_id: libraryId, borrowed_at: new Date().toISOString(), due_date: dueDate.toISOString(), status: "active" })
    .select()
    .single();
  if (insertError) throw new Error("Erro ao criar empréstimo: " + insertError.message);

  try { await sendEmail(newLoan.id, 'newLoan'); } catch {}
  revalidatePath("/admin/loans");
  return { success: true, message: "Empréstimo criado com sucesso." };
}