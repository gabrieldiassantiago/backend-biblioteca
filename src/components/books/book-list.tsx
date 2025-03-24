import { createClient } from "@/lib/supabase/server"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DeleteBookButton } from "./delete-book-button"
import type { Book } from "../../app/(admin)/admin/books/types/BookFormData"
import { EditBookButton } from "./edit-book.button"
import Link from "next/link"
import { BookStatus } from "./book-status"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cache } from "react"

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
}: {
  libraryId: string
  page: number
  pageSize: number
  search: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from("books")
    .select("*", { count: "exact" })
    .eq("library_id", libraryId)

  if (search) {
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`)
  }

  const { data: books, count, error } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order("created_at", { ascending: false })

  if (error) throw new Error("Erro ao buscar livros")

  return { books, count }
}

export async function BookList({
  page = 1,
  pageSize = 10,
  search = "",
}: {
  page?: number
  pageSize?: number
  search?: string
}) {
  const libraryId = await getCachedUserLibraryId()
  const { books, count } = await fetchBooksAndCount({ libraryId, page, pageSize, search })

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead className="text-center">Disponível</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books?.length ? (
              books.map((book: Book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell className="font-mono text-xs">{book.isbn}</TableCell>
                  <TableCell className="text-center">{book.stock}</TableCell>
                  <TableCell className="text-center">
                    <BookStatus available={book.available} stock={book.stock} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <EditBookButton book={book} />
                      <DeleteBookButton bookId={book.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {search ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-muted-foreground">Nenhum livro encontrado para &quot;{search}&quot;</p>
                      <Link href="/admin/books" className="text-sm underline underline-offset-4">
                        Limpar busca
                      </Link>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum livro cadastrado</p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild disabled={page <= 1} className="h-9 px-4">
              <Link
                href={`/admin/books?page=${page > 1 ? page - 1 : 1}${search ? `&search=${search}` : ""}`}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild disabled={page >= totalPages} className="h-9 px-4">
              <Link
                href={`/admin/books?page=${page < totalPages ? page + 1 : totalPages}${search ? `&search=${search}` : ""}`}
                className="flex items-center gap-1"
              >
                <span>Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}