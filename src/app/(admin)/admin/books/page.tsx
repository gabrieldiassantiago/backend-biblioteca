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
    <div className="container mx-auto px-4 py-8 space-y-10 max-w-7xl">
    {/* Header Section */}
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Gerenciar Livros
        </h1>
        <AddBookButton/>
      </div>
        
        <div className="relative w-full sm:max-w-xs">
        <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />          <form>
            <Input
            placeholder="Busque por livros, autor etc..."
            name="search"
            defaultValue={search}
            className="pl-10 pr-10 py-2 rounded-lg border border-input bg-background shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 dark:bg-gray-800 dark:border-gray-700"
            aria-label="Pesquisar livros por título ou autor"
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
