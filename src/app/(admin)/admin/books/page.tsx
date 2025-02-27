import { Suspense } from "react";
import { Loader2 } from 'lucide-react';
import { AddBookButton } from "./add-book-button";
import { BookList } from "./book-list";

export default function BooksPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Gerenciar Livros</h1>
        <AddBookButton />
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <BookList />
      </Suspense>
    </div>
  );
}