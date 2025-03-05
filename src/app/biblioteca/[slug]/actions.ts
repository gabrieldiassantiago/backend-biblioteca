"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Interface para Livro
interface Book {
  id: string;
  title: string;
  author: string;
  available: number; // Ajustado para number conforme seu código
  stock: number;
}

// Interface para Empréstimo
interface Loan {
  id: string;
  book: Book;
  borrowed_at: string;
  due_date: string;
  status: "active" | "returned" | "overdue"; //active é emprestado, returned é devolvido, overdue é atrasado
}

// Interface para os dados brutos retornados do Supabase em fetchUserLoans
interface RawLoan {
  id: string;
  borrowed_at: string;
  due_date: string;
  status: "active" | "returned" | "overdue";
  books: {
    title: string;
    author: string;
  } | null; // Pode ser null se o join falhar
}

export async function handleRegisterAndBorrow(formData: FormData) {
  console.log("Iniciando handleRegisterAndBorrow");
  const supabase = await createClient();
  const bookId = formData.get("bookId") as string;
  const libraryId = formData.get("libraryId") as string;
  const slug = formData.get("slug") as string;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const classe = formData.get("class") as string;
  const grade = formData.get("grade") as string;     // captura os dados do formulário


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
      class: classe,
      grade: grade,
      library_id: libraryId,
    });

  if (userInsertError) {
    console.error("Erro ao inserir usuário na tabela users:", userInsertError.message);
    throw new Error("Erro ao registrar usuário na biblioteca: " + userInsertError.message);
  }
  console.log("Usuário inserido na tabela users");

  //esse if serve pra poder evitar problema no registro, pois aqui ele vai considerar que o usuario pode já existir ou não, ou seja, ele ainda precisa criar uma conta
  if (!bookId || bookId === "") {
    return { success: true, message: "Conta criada com sucesso!" };
  }

  //se ele passar por este if, ele vai tentar registrar o emprestimo + criar uma nova conta, isso depende das condições


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

export async function handleLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function fetchUserLoans(userId: string): Promise<Loan[]> {
  const supabase = await createClient();

  if (!userId) {
    throw new Error("userId é obrigatório");
  }

  const { data, error } = await supabase
    .from("loans")
    .select(`
      id,
      borrowed_at,
      due_date,
      status,
      books (title, author)
    `)
    .eq("user_id", userId)
    .order("borrowed_at", { ascending: false })
    .limit(5)
    .returns<RawLoan[]>();

  if (error) {
    console.error("Erro ao buscar empréstimos:", error.message);
    throw new Error("Erro ao buscar empréstimos: " + error.message);
  }

  // Normalizar os dados para corresponder à interface Loan
  const normalizedLoans: Loan[] = (data || []).map((loan: RawLoan) => ({
    id: loan.id,
    book: {
      id: "", // Não estamos selecionando o book_id
      title: loan.books?.title || "Título não encontrado",
      author: loan.books?.author || "Autor não encontrado",
      available: 0, // Livro emprestado, não disponível
      stock: 0, // Não temos essa info aqui, ajuste se precisar
    },
    borrowed_at: loan.borrowed_at,
    due_date: loan.due_date,
    status: loan.status,
  }));

  return normalizedLoans;
}

export async function handleLogin(formData: FormData) {
  console.log("Iniciando handleLogin");
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("Dados de login recebidos:", { email });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.error("Erro ao fazer login:", authError?.message);
    throw new Error("Erro ao fazer login: " + authError?.message);
  }

  console.log("Login bem-sucedido, usuário ID:", authData.user.id);
  return { success: true, message: "Login realizado com sucesso!" };
}

export async function getLibraryBySlug(slug: string) {
  const supabase = await createClient();
  const { data: library, error } = await supabase
    .from("libraries")
    .select("*")
    .eq("name", slug)
    .single();

  if (error || !library) {
    console.error("Erro ao buscar biblioteca:", error?.message || "Biblioteca não encontrada");
    return null;
  }
  return library;
}

export async function getBooksByLibraryId(libraryId: string, searchQuery: string, page: number, limit: number) {
  const supabase = await createClient();
  let query = supabase.from("books").select("*", { count: "exact" }).eq("library_id", libraryId);

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
  }

  const offset = (page - 1) * limit;
  const { data: books, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("Erro ao buscar livros:", error.message);
    return { books: [], count: 0 };
  }
  return { books, count };
}

export async function getUserSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    console.log("Nenhum usuário logado ou erro na sessão:", error?.message);
    return null;
  }
  return { id: user.id, email: user.email };
}