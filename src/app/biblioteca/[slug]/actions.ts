// src/lib/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function handleRegisterAndBorrow(formData: FormData) {
  console.log("Iniciando handleRegisterAndBorrow");
  const supabase = await createClient();
  const bookId = formData.get("bookId") as string;
  const libraryId = formData.get("libraryId") as string;
  const slug = formData.get("slug") as string;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("Dados recebidos:", { bookId, libraryId, slug, fullName, email });

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (authError || !authData.user) {
    console.error("Erro ao criar usuário:", authError?.message);
    throw new Error("Erro ao criar usuário: " + authError?.message);
  }

  const userId = authData.user.id;
  console.log("Usuário criado com ID:", userId);

  const { error: userInsertError } = await supabase
    .from("users")
    .insert({
      id: userId,
      email,
      full_name: fullName,
      role: "student",
      library_id: libraryId,
    });

  if (userInsertError) {
    console.error("Erro ao inserir usuário na tabela users:", userInsertError.message);
    throw new Error("Erro ao registrar usuário na biblioteca: " + userInsertError.message);
  }
  console.log("Usuário inserido na tabela users");

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("available, stock")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    console.error("Erro ao buscar livro:", bookError?.message);
    throw new Error("Erro ao buscar livro: " + (bookError?.message || "Livro não encontrado"));
  }
  if (book.available <= 0 || book.available > book.stock) {
    console.error("Livro indisponível ou estoque inválido:", { available: book.available, stock: book.stock });
    throw new Error("Este livro não está disponível para empréstimo.");
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const loanData = {
    user_id: userId,
    book_id: bookId,
    library_id: libraryId,
    borrowed_at: new Date().toISOString(),
    due_date: dueDate.toISOString(),
    status: "active",
  };
  console.log("Dados do empréstimo a serem inseridos:", loanData);

  const { error: loanInsertError } = await supabase.from("loans").insert(loanData);

  if (loanInsertError) {
    console.error("Erro ao criar empréstimo:", loanInsertError.message);
    throw new Error("Erro ao criar empréstimo: " + loanInsertError.message);
  }
  console.log("Empréstimo criado com sucesso");

  return { success: true, message: "Empréstimo realizado com sucesso!" };
}

export async function handleBorrow(formData: FormData) {
  console.log("Iniciando handleBorrow");
  const supabase = await createClient();
  const bookId = formData.get("bookId") as string;
  const libraryId = formData.get("libraryId") as string;
  const slug = formData.get("slug") as string;
  const userId = formData.get("userId") as string;

  console.log("Dados para empréstimo:", { bookId, libraryId, slug, userId });

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("available, stock")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    console.error("Erro ao buscar livro:", bookError?.message);
    throw new Error("Erro ao buscar livro: " + (bookError?.message || "Livro não encontrado"));
  }
  if (book.available <= 0 || book.available > book.stock) {
    console.error("Livro indisponível ou estoque inválido:", { available: book.available, stock: book.stock });
    throw new Error("Este livro não está disponível para empréstimo.");
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const loanData = {
    user_id: userId,
    book_id: bookId,
    library_id: libraryId,
    borrowed_at: new Date().toISOString(),
    due_date: dueDate.toISOString(),
    status: "active",
  };
  console.log("Dados do empréstimo a serem inseridos:", loanData);

  const { error: loanInsertError } = await supabase.from("loans").insert(loanData);

  if (loanInsertError) {
    console.error("Erro ao criar empréstimo:", loanInsertError.message);
    throw new Error("Erro ao criar empréstimo: " + loanInsertError.message);
  }
  console.log("Empréstimo criado com sucesso");

  return { success: true, message: "Empréstimo realizado com sucesso!" };
}