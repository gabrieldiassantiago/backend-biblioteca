import { Suspense } from "react"
import { AddBookButton } from "@/components/books/add-book-button"
import { BookList } from "@/components/books/book-list"
import { BookListSkeleton } from "@/components/books/book-skeleton"
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = params.page ? Number.parseInt(params.page) : 1
  const search = params.search || ""

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Livros</h1>
          <AddBookButton />
        </div>
        
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <form>
            <Input 
              placeholder="Buscar livros..." 
              name="search"
              defaultValue={search}
              className="pl-10"
            />
          </form>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Suspense fallback={<BookListSkeleton />}>
          <BookList page={page} search={search} />
        </Suspense>
      </div>
    </div>
  )
}
