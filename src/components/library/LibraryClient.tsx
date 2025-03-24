"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, BookOpen, User, LogOut, Library, BookMarked, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import BorrowModal from "./BorrowModal"
import UserLoans from "./UserLoans"
import type { LibraryClientProps } from "@/types/lbrary"
import { handleLogout } from "@/app/biblioteca/[slug]/actions"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "@/app/hooks/useDebounce"

export default function LibraryClient({
  library,
  books,
  count,
  params,
  searchQuery,
  page,
  limit,
  user,
  isSearched,
}: LibraryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [showUserLoans, setShowUserLoans] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    if (debouncedSearchTerm !== searchQuery && debouncedSearchTerm.trim() !== "") {
      setIsSearching(true)
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set("search", debouncedSearchTerm)
      newParams.set("page", "1")
      router.push(`/biblioteca/${params.slug}?${newParams.toString()}`)
    }
  }, [debouncedSearchTerm, router, params.slug, searchParams, searchQuery])

  // Reset search state when search completes
  useEffect(() => {
    setIsSearching(false)
  }, [books])

  if (!library) {
    return <div>Erro: Biblioteca não encontrada.</div>
  }

  const openBorrowModal = (bookId: string) => {
    setSelectedBookId(bookId)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (e.target.value === "") {
      router.push(`/biblioteca/${params.slug}`)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchTerm.trim() === "") {
      router.push(`/biblioteca/${params.slug}`)
      return
    }

    setIsSearching(true)
    const newParams = new URLSearchParams()
    newParams.set("search", searchTerm)
    newParams.set("page", "1")
    router.push(`/biblioteca/${params.slug}?${newParams.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with glass morphism effect */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href={`/biblioteca/${params.slug}`} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Library className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Biblioteca <span className="text-indigo-600 dark:text-indigo-400">{library.name}</span>
            </h1>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 rounded-full flex items-center gap-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Avatar className="h-8 w-8 border-2 border-indigo-100 dark:border-indigo-900">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline-block">
                    {user.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Usuário"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-1 p-1" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.full_name || user.email || "Usuário"}</p>
                    {user.full_name && user.email && (
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowUserLoans(true)}
                  className="p-3 cursor-pointer rounded-lg focus:bg-gray-100 dark:focus:bg-gray-800"
                >
                  <User className="mr-2 h-4 w-4 text-indigo-500" />
                  <span>Meus Empréstimos</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLogout()}
                  className="p-3 cursor-pointer rounded-lg focus:bg-gray-100 dark:focus:bg-gray-800"
                >
                  <LogOut className="mr-2 h-4 w-4 text-indigo-500" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Login / Registro
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar with floating effect */}
        <div className="max-w-2xl mx-auto mb-12 relative z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-indigo-600/5 rounded-2xl transform -rotate-1 scale-[1.03] blur-sm"></div>
          <form onSubmit={handleSearchSubmit} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                name="search"
                placeholder="Buscar livros por título ou autor..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-32 py-6 border-0 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400"
              />
              <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium py-6 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    "Buscar"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {showUserLoans ? (
          <UserLoans userId={user?.id} onClose={() => setShowUserLoans(false)} />
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-6" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Buscando livros...</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-center">
              Estamos procurando por &quot;{searchTerm}&quot; na biblioteca {library.name}.
            </p>
          </div>
        ) : isSearched ? (
          <>
            {books.length > 0 ? (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {count} resultado{count !== 1 ? "s" : ""} para &quot;{searchQuery}&quot;
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/biblioteca/${params.slug}`)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Limpar busca
                  </Button>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence>
                    {books.map((book, index) => (
                      <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="h-full overflow-hidden border-0 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
                          <CardHeader className="p-6 pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <h2 className="text-xl font-semibold text-gray-800 dark:text-white line-clamp-2">
                                {book.title}
                              </h2>
                              <Badge
                                className={`ml-2 flex-shrink-0 ${
                                  book.available === 0
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    : book.available < book.stock / 3
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                }`}
                              >
                                {book.available === 0
                                  ? "Indisponível"
                                  : book.available < book.stock / 3
                                    ? "Poucos disponíveis"
                                    : "Disponível"}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="p-6 pt-3 space-y-4">
                            <div className="space-y-2">
                              <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-1">
                                <span className="font-medium">Autor:</span> {book.author}
                              </p>
                              {book.isbn && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-1">
                                  <span className="font-medium">ISBN:</span> {book.isbn}
                                </p>
                              )}
                            </div>

                            <div className="pt-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Disponibilidade
                                </span>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {book.available}/{book.stock}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    book.available === 0
                                      ? "bg-red-500"
                                      : book.available < book.stock / 3
                                        ? "bg-amber-500"
                                        : "bg-green-500"
                                  }`}
                                  style={{ width: `${(book.available / book.stock) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </CardContent>

                          <CardFooter className="p-6 pt-0">
                            {book.available > 0 ? (
                              <Button
                                onClick={() => openBorrowModal(book.id)}
                                className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium py-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                <BookOpen className="mr-2 h-4 w-4" /> Emprestar
                              </Button>
                            ) : (
                              <Button
                                disabled
                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed py-6 rounded-xl"
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" /> Indisponível
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 px-4"
              >
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Nenhum livro encontrado</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                  Tente buscar com outros termos ou entre em contato com a biblioteca.
                </p>
                <Button
                  onClick={() => router.push(`/biblioteca/${params.slug}`)}
                  variant="outline"
                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
                >
                  Voltar para a página inicial
                </Button>
              </motion.div>
            )}

            {count !== null && count > limit && (
              <div className="mt-12 flex justify-center">
                <nav className="inline-flex rounded-xl overflow-hidden shadow-sm" aria-label="Pagination">
                  {Array.from({ length: Math.ceil(count / limit) }, (_, i) => (
                    <Link
                      key={i + 1}
                      href={`/biblioteca/${params.slug}?search=${encodeURIComponent(searchQuery)}&page=${i + 1}`}
                      className={`relative inline-flex items-center px-5 py-3 text-sm font-medium ${
                        page === i + 1
                          ? "z-10 bg-gradient-to-r from-violet-500 to-indigo-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      } border border-gray-200 dark:border-gray-700`}
                    >
                      {i + 1}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="relative mx-auto w-32 h-32 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-indigo-600/20 rounded-full blur-xl"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-full w-full h-full flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-md">
                <BookMarked className="h-12 w-12 text-indigo-500" />
              </div>
            </div>
            <h3 className="text-2xl font-medium text-gray-900 dark:text-white mb-3">
              Bem-vindo à Biblioteca {library.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-10">
              Digite um termo de busca acima para encontrar livros por título ou autor.
            </p>
          </motion.div>
        )}
      </main>

      <BorrowModal
        isOpen={isModalOpen}
        onClose={closeModal}
        bookId={selectedBookId || ""}
        libraryId={library.id}
        slug={params.slug}
        user={user}
      />
    </div>
  )
}

