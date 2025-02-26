// src/app/biblioteca/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import LibraryClient from "./LibraryClient";
import { notFound } from "next/navigation";

export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const paramsObj = await params;
  const library = await getLibraryBySlug(paramsObj.slug);
  if (!library) {
    notFound();
  }

  const searchParamsObj = await searchParams;
  const searchQuery = searchParamsObj.search || "";
  const page = parseInt(searchParamsObj.page || "1", 10);
  const limit = 10;

  const { books, count } = await getBooksByLibraryId(library.id, searchQuery, page, limit);
  const user = await getUserSession();

  return (
    <LibraryClient
      library={library}
      books={books}
      count={count}
      params={paramsObj}
      searchQuery={searchQuery}
      page={page}
      limit={limit}
      user={user}
    />
  );
}

async function getLibraryBySlug(slug: string) {
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

async function getBooksByLibraryId(libraryId: string, searchQuery: string, page: number, limit: number) {
  const supabase = await createClient();
  let query = supabase
    .from("books")
    .select("*", { count: "exact" })
    .eq("library_id", libraryId);

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

async function getUserSession() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.log("Nenhum usuário logado ou erro na sessão:", error?.message);
    return null;
  }
  return { id: user.id, email: user.email };
}