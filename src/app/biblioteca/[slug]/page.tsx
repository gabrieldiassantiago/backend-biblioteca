import LibraryClient from "@/components/library/LibraryClient"
import { notFound } from "next/navigation"
import { getLibraryBySlug, getBooksByLibraryId, getUserSession } from "./actions"
import { Suspense } from "react"
import LibraryLoading from "@/components/library/LibraryLoading"
import { Book } from "@/types/lbrary"

export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const paramsObj = await params
  const library = await getLibraryBySlug(paramsObj.slug)

  if (!library) {
    notFound()
  }

  const searchParamsObj = await searchParams
  const searchQuery = searchParamsObj.search || ""
  const page = Number.parseInt(searchParamsObj.page || "1", 10)
  const limit = 10

  // Verificar se há uma busca ativa
  const isSearched = !!searchQuery

  // Buscar livros apenas se houver um termo de busca
  let books: Book[] = []
  let count = 0

  if (isSearched) {
    const result = await getBooksByLibraryId(library.id, searchQuery, page, limit)
    books = result.books as Book[]
    count = result.count || 0
  }

  const user = await getUserSession()

  return (
    <Suspense fallback={<LibraryLoading />}>
      <LibraryClient
        library={library}
        books={books}
        count={count}
        params={paramsObj}
        searchQuery={searchQuery}
        page={page}
        limit={limit}
        user={user}
        isSearched={isSearched}
      />
    </Suspense>
  )
}