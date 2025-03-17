// src/app/(admin)/admin/loans/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/app/lib/email-service";

// Obter o ID da biblioteca do usuário autenticado
async function getUserLibraryId() {
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

// Buscar livros por título
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

// Buscar alunos/usuários por nome
export async function searchUsers(query: string) {
  try {
    const supabase = await createClient();
    const libraryId = await getUserLibraryId();

    if (!query || query.trim().length < 2) return [];

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .eq("library_id", libraryId)
      .eq("role", "student")
      .ilike("full_name", `%${query}%`)
      .order("full_name")
      .limit(10);

    if (error) throw new Error("Erro ao buscar usuários: " + error.message);
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
}

// Criar um novo empréstimo
export async function createNewLoan(bookId: string, userId: string) {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();

  // Verificar se o livro está disponível
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("available, stock")
    .eq("id", bookId)
    .single();

  if (bookError || !book) throw new Error("Livro não encontrado");
  if (book.available <= 0 || book.stock <= 0) throw new Error("Livro não está disponível para empréstimo");

  // Verificar se o aluno já tem empréstimos pendentes ou ativos em excesso
  const { data: activeLoans, error: loansError } = await supabase
    .from("loans")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["pending", "active"]);

  if (loansError) throw new Error("Erro ao verificar empréstimos ativos: " + loansError.message);
  if (activeLoans?.length >= 3) throw new Error("Usuário já atingiu o limite de empréstimos pendentes ou ativos");

  // Criar o empréstimo com status "active"
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const { data: newLoan, error: insertError } = await supabase
    .from("loans")
    .insert({
      user_id: userId,
      book_id: bookId,
      library_id: libraryId,
      borrowed_at: new Date().toISOString(),
      due_date: dueDate.toISOString(),
      status: "active",
    })
    .select()
    .single();

  if (insertError) throw new Error("Erro ao criar empréstimo: " + insertError.message);

  // Enviar email de confirmação
  try {
    await sendEmail(newLoan.id, 'newLoan');
    console.log(`Email de confirmação enviado para o empréstimo ${newLoan.id}`);
  } catch (emailError) {
    console.error("Erro ao enviar email de confirmação:", emailError);
  }

  revalidatePath("/admin/loans");
  return { success: true, message: "Empréstimo criado com sucesso. Uma notificação foi enviada ao usuário." };
}

// Atualizar o status de um empréstimo
export async function updateLoanStatus(loanId: string, newStatus: "pending" | "active" | "returned" | "overdue" | "rejected") {
  console.log("Iniciando updateLoanStatus", { loanId, newStatus });
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();

  // Verificar se o empréstimo existe e pertence à biblioteca
  const { data: loan, error: fetchError } = await supabase
    .from("loans")
    .select("library_id, status, book_id")
    .eq("id", loanId)
    .single();

  if (fetchError || !loan) throw new Error("Empréstimo não encontrado: " + (fetchError?.message || "Desconhecido"));
  if (loan.library_id !== libraryId) throw new Error("Você não tem permissão para atualizar este empréstimo");
  if (loan.status === newStatus) throw new Error(`Este empréstimo já está como "${newStatus}"`);

  // Preparar os dados de atualização
  const updateData: { status: string; returned_at?: string | null; updated_at: string } = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // Ajustar a data de devolução se for "returned"
  if (newStatus === "returned") {
    updateData.returned_at = new Date().toISOString();
  } else {
    updateData.returned_at = null;
  }

  // Atualizar o status do empréstimo
  const { error: updateError } = await supabase
    .from("loans")
    .update(updateData)
    .eq("id", loanId);

  if (updateError) {
    console.error("Erro ao atualizar status:", updateError.message, updateError.details);
    throw new Error("Erro ao atualizar status do empréstimo: " + (updateError.message || "Detalhes indisponíveis"));
  }

  // Ajustar a disponibilidade do livro conforme o status
  if (newStatus === "active" && loan.status === "pending") {
    // Aprovar empréstimo: reduzir estoque disponível
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("available")
      .eq("id", loan.book_id)
      .single();

    if (bookError || !book) throw new Error("Livro não encontrado: " + (bookError?.message || "Desconhecido"));
    if (book.available <= 0) throw new Error("Livro não está mais disponível");

    const { error: stockError } = await supabase
      .from("books")
      .update({ available: book.available - 1, updated_at: new Date().toISOString() })
      .eq("id", loan.book_id);

    if (stockError) throw new Error("Erro ao atualizar estoque do livro: " + stockError.message);
  } else if (newStatus === "returned" && (loan.status === "active" || loan.status === "overdue")) {
    // Devolver livro: aumentar estoque disponível
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("available, stock")
      .eq("id", loan.book_id)
      .single();

    if (bookError || !book) throw new Error("Livro não encontrado: " + (bookError?.message || "Desconhecido"));

    const { error: stockError } = await supabase
      .from("books")
      .update({ available: Math.min(book.available + 1, book.stock), updated_at: new Date().toISOString() })
      .eq("id", loan.book_id);

    if (stockError) throw new Error("Erro ao atualizar estoque do livro: " + stockError.message);

    // Enviar email de devolução
    try {
      await sendEmail(loanId, 'returnedLoan');
      console.log(`Email de devolução enviado para o empréstimo ${loanId}`);
    } catch (emailError) {
      console.error("Erro ao enviar email de devolução:", emailError);
    }
  } else if (newStatus === "rejected" && loan.status === "pending") {
    // Não é necessário ajustar o estoque, pois o livro não foi reservado ainda
    console.log("Empréstimo rejeitado, sem alterações no estoque.");
  }

  revalidatePath("/admin/loans");
  return { success: true, message: `Status atualizado para "${newStatus}" com sucesso!` };
}

// Estender o prazo de devolução de um empréstimo
export async function extendLoanDueDate(loanId: string, formData: FormData) {
  console.log("Iniciando extendLoanDueDate", { loanId });
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();
  const newDueDate = formData.get("dueDate") as string;

  if (!newDueDate) throw new Error("Data de devolução não fornecida");

  // Verificar se o empréstimo existe e pertence à biblioteca
  const { data: loan, error: fetchError } = await supabase
    .from("loans")
    .select("library_id, due_date, status")
    .eq("id", loanId)
    .single();

  if (fetchError || !loan) throw new Error("Empréstimo não encontrado: " + (fetchError?.message || "Desconhecido"));
  if (loan.library_id !== libraryId) throw new Error("Você não tem permissão para atualizar este empréstimo");

  const currentDueDate = new Date(loan.due_date).toISOString().split("T")[0];
  if (currentDueDate === newDueDate) throw new Error("A nova data é igual à data atual");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(newDueDate);
  let newStatus = loan.status;

  if (dueDate > today && loan.status === "overdue") {
    newStatus = "active";
  }

  const { error: updateError } = await supabase
    .from("loans")
    .update({ 
      due_date: newDueDate, 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", loanId);

  if (updateError) {
    console.error("Erro ao estender prazo:", updateError.message, updateError.details);
    throw new Error("Falha ao estender o prazo do empréstimo: " + (updateError.message || "Detalhes indisponíveis"));
  }

  revalidatePath("/admin/loans");
  return { success: true, message: "Prazo estendido com sucesso!" };
}