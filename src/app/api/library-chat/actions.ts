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

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("available, title")
    .eq("id", bookId)
    .eq("library_id", userData.library_id)
    .single();

  if (bookError || !book) throw new Error("Livro não encontrado");

  if (book.available <= 0) throw new Error("Livro não disponível para empréstimo");

  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .eq("library_id", userData.library_id)
    .single();

  if (!targetUser) throw new Error("Usuário não encontrado");

  const due = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

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

  if (loanError) throw new Error("Erro ao criar empréstimo");

  await supabase
    .from("books")
    .update({ available: book.available - 1 })
    .eq("id", bookId);

  revalidatePath("/admin/loans");

  return { success: true, message: "Empréstimo criado", loanId: loan.id };
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

  const { data: users, error } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("library_id", userData.library_id)
    .ilike("full_name", `%${query}%`)
    .limit(10);

  if (error) throw new Error(`Erro ao buscar usuários: ${error.message}`);

  return users;
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

  const { data: foundUsers } = await supabase
    .from("users")
    .select("id")
    .eq("library_id", userData.library_id)
    .ilike("full_name", `%${userName}%`)
    .limit(2);

  if (!foundUsers || foundUsers.length !== 1) throw new Error("Usuário não encontrado ou múltiplos encontrados");

  const { data: books } = await supabase
    .from("books")
    .select("id")
    .eq("library_id", userData.library_id)
    .ilike("title", `%${bookTitle}%`)
    .limit(2);

  if (!books || books.length !== 1) throw new Error("Livro não encontrado ou múltiplos encontrados");

  const { data: loanData } = await supabase
    .from("loans")
    .select("id, due_date")
    .eq("user_id", foundUsers[0].id)
    .eq("book_id", books[0].id)
    .eq("library_id", userData.library_id)
    .eq("status", "active")
    .single();

  if (!loanData) throw new Error("Empréstimo ativo não encontrado");

  const newDueDate = specificDueDate || new Date(new Date(loanData.due_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("loans")
    .update({ due_date: newDueDate })
    .eq("id", loanData.id);

  if (error) throw new Error("Erro ao renovar empréstimo");

  revalidatePath("/admin/loans");

  return { success: true, message: "Empréstimo renovado" };
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
  const { data: loanData } = await supabase
    .from("loans")
    .select("id, book_id")
    .eq("id", loanId)
    .eq("library_id", userData.library_id)
    .eq("status", "active")
    .single();
  if (!loanData) throw new Error("Empréstimo não encontrado");
  const { data: bookData } = await supabase
    .from("books")
    .select("id, available")
    .eq("id", loanData.book_id)
    .eq("library_id", userData.library_id)
    .single();
  if (!bookData) throw new Error("Livro não encontrado");
  const { error: updateLoanError } = await supabase
    .from("loans")
    .update({ status: "returned", returned_at: new Date().toISOString() })
    .eq("id", loanData.id);
  if (updateLoanError) throw new Error("Erro ao atualizar empréstimo");
  const { error: updateBookError } = await supabase
    .from("books")
    .update({ available: bookData.available + 1 })
    .eq("id", bookData.id);
  if (updateBookError) throw new Error("Erro ao atualizar livro");
  revalidatePath("/admin/loans");
  return { success: true, message: "Empréstimo devolvido" };
}


// src/app/api/library-chat/actions.ts

// src/app/api/library-chat/actions.ts

export async function checkLoansAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: userData } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();
  if (!userData?.library_id) throw new Error("Usuário sem biblioteca");

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

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
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return loans; // cada loan tem books: [{ title }], users: [{ full_name }]
}