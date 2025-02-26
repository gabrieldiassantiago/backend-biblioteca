// src/app/biblioteca/[slug]/LibraryClient.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { handleRegisterAndBorrow, handleBorrow } from "./actions";

interface LibraryClientProps {
  library: {
    id: string;
    name: string;
    location?: string | null;
    contact_email?: string | null;
    created_at: string;
    updated_at: string;
  };
  books: {
    id: string;
    library_id: string;
    title: string;
    author: string;
    isbn?: string | null;
    stock: number;
    available: number;
    created_at: string;
    updated_at: string;
  }[];
  
  count: number | null; // Ajustado para aceitar null
  params: { slug: string };
  searchQuery: string;
  page: number;
  limit: number;
  user: { id: string; email: string | undefined } | null; // Ajustado para aceitar undefined em email
}

export default function LibraryClient({
  library,
  books,
  count,
  params,
  searchQuery,
  page,
  limit,
  user,
}: LibraryClientProps) {
  if (!library) {
    return <div>Erro: Biblioteca não encontrada.</div>;
  }

  function BorrowModal({ bookId }: { bookId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRegistering, setIsRegistering] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAuthSubmit = async (formData: FormData) => {
      setError(null);
      setSuccess(null);
      try {
        const result = await handleRegisterAndBorrow(formData);
        if (result.success) {
          setSuccess(result.message);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    const handleBorrowSubmit = async (formData: FormData) => {
      setError(null);
      setSuccess(null);
      try {
        const result = await handleBorrow(formData);
        if (result.success) {
          setSuccess(result.message);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    const isAuthenticated = !!user;

    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <BookOpen className="mr-2 h-4 w-4" /> Emprestar
        </Button>

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
              {success ? (
                <>
                  <h2 className="text-xl font-bold mb-4 text-green-600">Ok</h2>
                  <p className="text-gray-600 mb-4">{success}</p>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setIsOpen(false)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Fechar
                    </Button>
                  </div>
                </>
              ) : isAuthenticated ? (
                <>
                  <h2 className="text-xl font-bold mb-4">Confirme o empréstimo</h2>
                  <p className="text-gray-600 mb-4">
                    Prazo de entrega: 7 dias. Confirma o empréstimo?
                  </p>
                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                  <form action={handleBorrowSubmit}>
                    <input type="hidden" name="bookId" value={bookId} />
                    <input type="hidden" name="libraryId" value={library.id} />
                    <input type="hidden" name="slug" value={params.slug} />
                    <input type="hidden" name="userId" value={user?.id || ""} />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="bg-gray-300 hover:bg-gray-400"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Confirmar Empréstimo
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-4">
                    {isRegistering ? "Crie sua conta" : "Faça login"}
                  </h2>
                  <form action={handleAuthSubmit}>
                    <input type="hidden" name="bookId" value={bookId} />
                    <input type="hidden" name="libraryId" value={library.id} />
                    <input type="hidden" name="slug" value={params.slug} />
                    {isRegistering && (
                      <div className="mb-4">
                        <Input name="fullName" placeholder="Nome completo" required />
                      </div>
                    )}
                    <div className="mb-4">
                      <Input type="email" name="email" placeholder="Email" required />
                    </div>
                    <div className="mb-4">
                      <Input type="password" name="password" placeholder="Senha" required />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <div className="flex justify-between items-center">
                      <Button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-blue-600 hover:underline"
                      >
                        {isRegistering ? "Já tenho conta" : "Criar conta"}
                      </Button>
                      <div className="space-x-2">
                        <Button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="bg-gray-300 hover:bg-gray-400"
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                          {isRegistering ? "Registrar e Emprestar" : "Login e Emprestar"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">
          Biblioteca {library.name}
        </h1>

        <div className="flex justify-center mb-8">
          <form action={`/biblioteca/${params.slug}`} method="GET" className="w-full max-w-lg">
            <div className="relative">
              <Input
                type="text"
                name="search"
                placeholder="Buscar livros por título ou autor..."
                defaultValue={searchQuery}
                className="w-full border-gray-300 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.length > 0 ? (
            books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{book.title}</h2>
                <p className="text-gray-600 mb-1">Autor: {book.author}</p>
                <p className="text-gray-600 mb-1">ISBN: {book.isbn || "N/A"}</p>
                <p className="text-gray-600 mb-4">
                  Disponibilidade: {book.available} de {book.stock}
                </p>
                {book.available > 0 ? (
                  <BorrowModal bookId={book.id} />
                ) : (
                  <p className="text-red-500 font-medium">Indisponível</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center col-span-full">
              Nenhum livro encontrado nesta biblioteca.
            </p>
          )}
        </div>

        {count !== null && count > limit && (
          <div className="mt-8 flex justify-center space-x-2">
            {Array.from({ length: Math.ceil(count / limit) }, (_, i) => (
              <Link
                key={i + 1}
                href={`/biblioteca/${params.slug}?search=${encodeURIComponent(searchQuery)}&page=${i + 1}`}
                className={`px-4 py-2 rounded-lg ${
                  page === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}