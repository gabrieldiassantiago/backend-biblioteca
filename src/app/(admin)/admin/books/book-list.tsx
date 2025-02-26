import { createClient } from "@/lib/supabase/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DeleteBookButton } from "./delete-book-button"
import type { Book } from "./BookFormData"
import { EditBookButton } from "./edit-book.button"

async function getUserLibraryId() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('library_id')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.library_id) {
    throw new Error("Usuário não está vinculado a uma biblioteca")
  }

  return userData.library_id
}

export async function BookList({
  page = 1,
  pageSize = 10,
}: {
  page?: number
  pageSize?: number
}) {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()
  
  // Buscar total de registros da biblioteca do usuário
  const { count } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('library_id', libraryId)

  // Buscar livros da biblioteca do usuário com paginação
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('library_id', libraryId)
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('created_at', { ascending: false })

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="rounded-md border">
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
          {books?.map((book: Book) => (
            <TableRow key={book.id}>
              <TableCell className="font-medium">{book.title}</TableCell>
              <TableCell>{book.author}</TableCell>
              <TableCell>{book.isbn}</TableCell>
              <TableCell className="text-center">{book.stock}</TableCell>
              <TableCell className="text-center">
              <Badge variant={book.available > 0 ? "default" : "secondary"}>
             {book.available}
            </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <EditBookButton book={book} />
                <DeleteBookButton bookId={book.id} />
              </TableCell>
            </TableRow>
          ))}
          {!books?.length && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                Nenhum livro cadastrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </div>
        </div>
      )}
    </div>
  )
}
