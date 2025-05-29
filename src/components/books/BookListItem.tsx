"use client"

import { BookOpen, User, Hash, Package, Eye } from "lucide-react"
import Image from "next/image"
import { EditBookButton } from "./edit-book.button"
import { DeleteBookButton } from "./delete-book-button"
import type { Book } from "../../app/(admin)/admin/books/types/BookFormData"

interface BookListItemProps {
  book: Book
}

export function BookListItem({ book }: BookListItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg shadow-sm">
      <div className="w-16 h-20 overflow-hidden bg-gray-100 rounded shrink-0">
        {book.image_url ? (
          <Image
            src={book.image_url}
            alt={`Capa do livro ${book.title}`}
            width={64}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="flex-1 space-y-1">
        <h4 className="font-semibold text-gray-900 line-clamp-1">{book.title}</h4>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <User className="w-3 h-3" />
          {book.author}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {book.isbn}
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            Estoque: {book.stock}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Disp.: {book.available}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <EditBookButton book={book} />
        <DeleteBookButton bookId={book.id} />
      </div>
    </div>
  )
}
