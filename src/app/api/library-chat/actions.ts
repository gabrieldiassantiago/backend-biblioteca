"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLoanAction(bookId: string, userId: string, dueDate?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");

  const { data: userData } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();

  if (!userData?.library_id) {
    console.log("Usuário sem biblioteca vinculada, redirecionando");
    redirect("/login");
  }

  try {
    // Verificar se o livro existe e pertence à biblioteca do usuário
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("available, title")
      .eq("id", bookId)
      .eq("library_id", userData.library_id)
      .single();

    if (bookError || !book) throw new Error("Livro não encontrado ou não pertence à sua biblioteca");

    if (book.available <= 0) throw new Error(`Livro "${book.title}" não disponível para empréstimo (estoque esgotado)`);

    // Verificar se o usuário existe e pertence à biblioteca
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("id", userId)
      .eq("library_id", userData.library_id)
      .single();

    if (userError || !targetUser) throw new Error("Usuário não encontrado ou não pertence à sua biblioteca");

    // Calcular data de vencimento padrão (14 dias) se não fornecida
    const due = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Criar o empréstimo
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .insert({
        book_id: bookId,
        user_id: userId,
        library_id: userData.library_id,
        due_date: due,
        status: "active",
      })
      .select("id")
      .single();

    if (loanError) throw new Error(`Erro ao criar empréstimo: ${loanError.message}`);

    // Atualizar disponibilidade do livro
    const { error: updateError } = await supabase
      .from("books")
      .update({ available: book.available - 1 })
      .eq("id", bookId);

    if (updateError) throw new Error(`Erro ao atualizar disponibilidade do livro: ${updateError.message}`);

    revalidatePath("/admin/loans");

    return { 
      success: true, 
      message: `Empréstimo criado com sucesso para ${targetUser.full_name}`, 
      loanId: loan.id 
    };
  } catch (error) {
    // Melhor tratamento de erros com mensagens mais descritivas
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao criar empréstimo";
    console.error("Erro em createLoanAction:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function searchUsersAction(query: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");

  const { data: userData } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();

  if (!userData?.library_id) redirect("/login");

  try {
    // Busca mais abrangente: nome completo ou email
    const { data: users, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("library_id", userData.library_id)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (error) throw new Error(`Erro ao buscar usuários: ${error.message}`);

    return users;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao buscar usuários";
    console.error("Erro em searchUsersAction:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function renewLoanAction(userName: string, bookTitle: string, specificDueDate?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");

  const { data: userData } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();

  if (!userData?.library_id) redirect("/login");

  try {
    // Buscar usuário pelo nome
    const { data: foundUsers, error: userError } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("library_id", userData.library_id)
      .ilike("full_name", `%${userName}%`)
      .limit(2);

    if (userError) throw new Error(`Erro ao buscar usuário: ${userError.message}`);
    if (!foundUsers || foundUsers.length === 0) throw new Error(`Usuário "${userName}" não encontrado`);
    if (foundUsers.length > 1) throw new Error(`Múltiplos usuários encontrados com o nome "${userName}". Por favor, seja mais específico.`);

    // Buscar livro pelo título
    const { data: books, error: bookError } = await supabase
      .from("books")
      .select("id, title")
      .eq("library_id", userData.library_id)
      .ilike("title", `%${bookTitle}%`)
      .limit(2);

    if (bookError) throw new Error(`Erro ao buscar livro: ${bookError.message}`);
    if (!books || books.length === 0) throw new Error(`Livro "${bookTitle}" não encontrado`);
    if (books.length > 1) throw new Error(`Múltiplos livros encontrados com o título "${bookTitle}". Por favor, seja mais específico.`);

    // Buscar empréstimo ativo
    const { data: loanData, error: loanError } = await supabase
      .from("loans")
      .select("id, due_date")
      .eq("user_id", foundUsers[0].id)
      .eq("book_id", books[0].id)
      .eq("library_id", userData.library_id)
      .eq("status", "active")
      .single();

    if (loanError) throw new Error(`Empréstimo não encontrado: ${loanError.message}`);
    if (!loanData) throw new Error(`Não há empréstimo ativo de "${books[0].title}" para ${foundUsers[0].full_name}`);

    // Calcular nova data de vencimento (padrão: +14 dias da data atual de vencimento)
    const newDueDate = specificDueDate || 
      new Date(new Date(loanData.due_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Atualizar data de vencimento
    const { error: updateError } = await supabase
      .from("loans")
      .update({ due_date: newDueDate })
      .eq("id", loanData.id);

    if (updateError) throw new Error(`Erro ao renovar empréstimo: ${updateError.message}`);

    revalidatePath("/admin/loans");

    return { 
      success: true, 
      message: `Empréstimo de "${books[0].title}" para ${foundUsers[0].full_name} renovado com sucesso até ${new Date(newDueDate).toLocaleDateString('pt-BR')}` 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao renovar empréstimo";
    console.error("Erro em renewLoanAction:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function returnLoanAction(loanId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");
  
  const { data: userData } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();
    
  if (!userData?.library_id) redirect("/login");
  
  try {
    // Buscar informações do empréstimo
    const { data: loanData, error: loanError } = await supabase
      .from("loans")
      .select("id, book_id, user_id")
      .eq("id", loanId)
      .eq("library_id", userData.library_id)
      .eq("status", "active")
      .single();

    if (loanError || !loanData) throw new Error("Empréstimo não encontrado ou já finalizado");

    // Buscar informações do livro
    const { data: bookData, error: bookError } = await supabase
      .from("books")
      .select("id, title, available, stock")
      .eq("id", loanData.book_id)
      .eq("library_id", userData.library_id)
      .single();

    if (bookError || !bookData) throw new Error("Livro não encontrado");

    // Buscar informações do usuário
    const { data: borrowerData } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", loanData.user_id)
      .single();

    // Atualizar status do empréstimo
    const { error: updateLoanError } = await supabase
      .from("loans")
      .update({ 
        status: "returned", 
        returned_at: new Date().toISOString() 
      })
      .eq("id", loanData.id);

    if (updateLoanError) throw new Error(`Erro ao atualizar empréstimo: ${updateLoanError.message}`);

    // Verificar se a disponibilidade não excederá o estoque
    if (bookData.available >= bookData.stock) {
      throw new Error(`Erro: A disponibilidade do livro "${bookData.title}" já está no máximo (${bookData.stock})`);
    }

    // Atualizar disponibilidade do livro
    const { error: updateBookError } = await supabase
      .from("books")
      .update({ available: bookData.available + 1 })
      .eq("id", bookData.id);

    if (updateBookError) throw new Error(`Erro ao atualizar disponibilidade do livro: ${updateBookError.message}`);

    revalidatePath("/admin/loans");

    return { 
      success: true, 
      message: `Empréstimo de "${bookData.title}" para ${borrowerData?.full_name || 'usuário'} devolvido com sucesso` 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao devolver empréstimo";
    console.error("Erro em returnLoanAction:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function checkLoansAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: userData } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();
    
  if (!userData?.library_id) throw new Error("Usuário sem biblioteca");

  try {
    // Buscar empréstimos da última semana
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: loans, error } = await supabase
      .from("loans")
      .select(`
        id,
        created_at,
        due_date,
        status,
        books:book_id ( id, title ),
        users:user_id ( id, full_name, email )
      `)
      .eq("library_id", userData.library_id)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Adicionar informações sobre atraso
    const today = new Date();
    const processedLoans = loans.map(loan => {
      const dueDate = new Date(loan.due_date);
      const isOverdue = loan.status === 'active' && dueDate < today;
      const daysOverdue = isOverdue ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        ...loan,
        isOverdue,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0
      };
    });
    
    return processedLoans;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao verificar empréstimos";
    console.error("Erro em checkLoansAction:", errorMessage);
    throw new Error(errorMessage);
  }
}
