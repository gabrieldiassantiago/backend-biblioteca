import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { DeleteBookButton } from "./delete-book-button"
import type { Book } from "../../app/(admin)/admin/books/types/BookFormData"
import { EditBookButton } from "./edit-book.button"
import Link from "next/link"
import { BookStatus } from "./book-status"
import { BookOpen, User, Hash, Package, Eye } from "lucide-react"
import { cache } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "./pagination"
import Image from "next/image"
import { BookListItem } from "./BookListItem"

// Cache para library_id do usuário
const getCachedUserLibraryId = cache(async () => {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData?.library_id) {
    throw new Error("Usuário não está vinculado a uma biblioteca")
  }

  return userData.library_id
})

// Função para buscar livros e contagem em uma única chamada
async function fetchBooksAndCount({
  libraryId,
  page,
  pageSize,
  search,
  status,
  sort,
}: {
  libraryId: string
  page: number
  pageSize: number
  search: string
  status: string
  sort: string
}) {
  const supabase = await createClient()

  let query = supabase.from("books").select("*", { count: "exact" }).eq("library_id", libraryId)

  if (search) {
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`)
  }

  // Status filter
  if (status === "available") {
    query = query.gt("available", 0)
  } else if (status === "out") {
    query = query.eq("available", 0)
  } else if (status === "low") {
    query = query.gt("available", 0).lt("available", 5) // Adjust threshold as needed
  }

  // Sorting
  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true })
      break
    case "title-asc":
      query = query.order("title", { ascending: true })
      break
    case "title-desc":
      query = query.order("title", { ascending: false })
      break
    case "author-asc":
      query = query.order("author", { ascending: true })
      break
    case "author-desc":
      query = query.order("author", { ascending: false })
      break
    case "stock-high":
      query = query.order("stock", { ascending: false })
      break
    case "stock-low":
      query = query.order("stock", { ascending: true })
      break
    default: // newest
      query = query.order("created_at", { ascending: false })
  }

  const { data: books, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw new Error("Erro ao buscar livros")

  return { books, count }
}

export async function BookList({
  page = 1,
  pageSize = 12,
  search = "",
  status = "",
  author = "",
  sort = "newest",
  view = "grid",
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  author?: string
  sort?: string
  view?: string
}) {
  const libraryId = await getCachedUserLibraryId()
  const { books, count } = await fetchBooksAndCount({ libraryId, page, pageSize, search, status, sort })

  const totalPages = Math.ceil((count || 0) / pageSize)

  if (!books?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-12 h-12 text-gray-400" />
        </div>
        {search ? (
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Nenhum livro encontrado</h3>
            <p className="text-gray-600 max-w-md">
              Não encontramos nenhum livro que corresponda à sua busca por <strong>{search}</strong>
            </p>
            <Link href="/admin/books">
              <Button variant="outline" className="mt-4">
                Limpar busca
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Nenhum livro cadastrado</h3>
            <p className="text-gray-600 max-w-md">Comece adicionando o primeiro livro à sua biblioteca</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {search ? (
            <span>
              <strong>{count}</strong> resultado{count !== 1 ? "s" : ""} para {search}
            </span>
          ) : (
            <span>
              <strong>{count}</strong> livro{count !== 1 ? "s" : ""} cadastrado{count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </div>
      </div>

      {/* Books Grid or List */}
      <div
        className={
          view === "list" ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        }
      >
        {books.map((book: Book) =>
          view === "list" ? (
          <div key={book.id} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
               <BookListItem book={book} />
          </div>
          ) : (
            // Existing card view
            <Card
              key={book.id}
              className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <CardContent className="p-0">
                {/* Book Cover */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-100 to-gray-200">
                  {book.image_url ? (
                    <Image
                      width={300}
                      height={400}
                      src={book.image_url || "/placeholder.svg"}
                      alt={`Capa do livro ${book.title}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <BookStatus available={book.available} stock={book.stock} />
                  </div>

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <EditBookButton book={book} />
                    <DeleteBookButton bookId={book.id} />
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">{book.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {book.author}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Hash className="w-3 h-3" />
                      <span className="font-mono">{book.isbn}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Package className="w-3 h-3" />
                        <span>Estoque: {book.stock}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Eye className="w-3 h-3" />
                        <span>Disp.: {book.available}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        search={search}
        status={status}
        author={author}
        sort={sort}
        view={view}
      />
    </div>
  )
}
