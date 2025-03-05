import { Suspense } from "react"
import { AddBookButton } from "../../../../components/books/add-book-button"
import { BookList } from "../../../../components/books/book-list"
import { BookListSkeleton } from "@/components/books/book-skeleton"

export default function BooksPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Gerenciar Livros</h1>
        <AddBookButton />
      </div>
      <Suspense fallback={<BookListSkeleton />}> 
        <BookList />
      </Suspense>
    </div>
  )
}

