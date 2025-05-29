"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  BookOpen,
  User,
  LogOut,
  Library,
  BookMarked,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Clock,
  Star,
  UserPlus,
} from "lucide-react"
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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import BorrowModal from "./BorrowModal"
import UserLoans from "./UserLoans"
import type { LibraryClientProps } from "@/types/lbrary"
import { handleLogout } from "@/app/biblioteca/[slug]/actions"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "@/app/hooks/useDebounce"
import Image from "next/image"

const getNavigationItems = (isLoggedIn: boolean) => {
  const baseItems = [
    {
      title: "Explorar",
      items: [
        {
          title: "Todos os Livros",
          icon: BookOpen,
          id: "all-books",
          badge: null,
        },
        {
          title: "Mais Populares",
          icon: TrendingUp,
          id: "popular",
          badge: "Novo",
        },
        {
          title: "Adicionados Recentemente",
          icon: Star,
          id: "recent",
          badge: null,
        },
      ],
    },
  ]

  if (isLoggedIn) {
    baseItems.push({
      title: "Minha Conta",
      items: [
        {
          title: "Meus Empréstimos",
          icon: BookMarked,
          id: "my-loans",
          badge: null,
        },
        {
          title: "Histórico",
          icon: Clock,
          id: "history",
          badge: null,
        },
      ],
    })
  } else {
    baseItems.push({
      title: "Acesso",
      items: [
        {
          title: "Fazer Login",
          icon: User,
          id: "login",
          badge: null,
        },
        {
          title: "Criar Conta",
          icon: UserPlus,
          id: "register",
          badge: "Grátis",
        },
      ],
    })
  }

  return baseItems
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
  isSearched,
}: LibraryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [showUserLoans, setShowUserLoans] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [isSearching, setIsSearching] = useState(false)
  const [activeSection, setActiveSection] = useState("all-books")
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

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (section === "my-loans") {
      setShowUserLoans(true)
    } else if (section === "login" || section === "register") {
      setIsModalOpen(true)
      if (section === "register") {
        // Você pode adicionar lógica aqui para definir o modal em modo de registro
      }
    } else {
      setShowUserLoans(false)
    }
  }

  const renderWelcomeSection = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 px-4">
      <div className="relative mx-auto w-32 h-32 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-indigo-600/20 rounded-full blur-xl"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-full w-full h-full flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-md">
          <BookMarked className="h-12 w-12 text-indigo-500" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Bem-vindo à Biblioteca {library.name}</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 text-lg">
        {user
          ? "Explore nossa coleção de livros, faça empréstimos e gerencie sua conta de forma simples e intuitiva."
          : "Faça login ou crie uma conta para emprestar livros e acompanhar seus empréstimos."}
      </p>

      {!user && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium px-8 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <User className="mr-2 h-5 w-5" />
            Fazer Login
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 px-8 py-3 rounded-xl transition-all duration-200"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Criar Conta Grátis
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <BookMarked className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Explorar Livros</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Navegue por nossa coleção completa de livros organizados por categoria.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mais Populares</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Descubra os livros mais emprestados e bem avaliados pelos usuários.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
            {user ? (
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            ) : (
              <User className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {user ? "Meus Empréstimos" : "Conta Pessoal"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {user
              ? "Acompanhe seus empréstimos ativos e o histórico de leituras."
              : "Crie uma conta para emprestar livros e acompanhar seu histórico."}
          </p>
        </div>
      </div>
    </motion.div>
  )

  const navigationItems = getNavigationItems(!!user)

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar className="border-r border-gray-200 dark:border-gray-800">
          <SidebarHeader className="border-b border-gray-200 dark:border-gray-800 p-6">
            <Link href={`/biblioteca/${params.slug}`} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Library className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{library.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sistema de Biblioteca</p>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-4">
            {navigationItems.map((group) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeSection === item.id}
                          className="w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-colors"
                        >
                          <button
                            onClick={() => handleSectionChange(item.id)}
                            className="flex items-center gap-3 w-full"
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1 text-left">{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger className="md:hidden" />

              {/* Search Bar - Centralizada */}
              <div className="flex-1 max-w-2xl mx-auto">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Buscar livros por título, autor ou ISBN..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-12 pr-32 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium px-4 rounded-lg transition-all duration-200"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Buscando
                        </>
                      ) : (
                        "Buscar"
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 rounded-full flex items-center gap-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Avatar className="h-8 w-8 border-2 border-indigo-100 dark:border-indigo-900">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm">
                          {user.full_name
                            ? user.full_name.charAt(0).toUpperCase()
                            : user.email?.charAt(0).toUpperCase()}
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

          {/* Main Content */}
          <main className="flex-1 p-6">
            {showUserLoans ? (
              <UserLoans userId={user?.id} onClose={() => setShowUserLoans(false)} />
            ) : isSearching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-6" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Buscando livros...</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-center">
                  Estamos procurando por {searchTerm} na biblioteca {library.name}.
                </p>
              </div>
            ) : isSearched ? (
              <>
                {books.length > 0 ? (
                  <>
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {count} resultado{count !== 1 ? "s" : ""} para {searchQuery}
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
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                      <AnimatePresence>
                        {books.map((book, index) => (
                          <motion.div
                            key={book.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className="h-full overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all duration-300 group">
                              <CardHeader className="p-0 pb-4">
                                {/* Imagem do livro */}
                                <div className="relative h-48 bg-gray-100 dark:bg-gray-800 rounded-t-xl overflow-hidden">
                                  {book.image_url ? (
                                    <Image
                                      width={300}
                                      height={300}
                                      src={book.image_url || "/placeholder.svg"}
                                      alt={`Capa do livro ${book.title}`}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none"
                                        e.currentTarget.nextElementSibling?.classList.remove("hidden")
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className={`${book.image_url ? "hidden" : "flex"} w-full h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700`}
                                  >
                                    <BookOpen className="h-16 w-16 text-gray-400" />
                                  </div>

                                  {/* Badge de disponibilidade sobreposto */}
                                  <div className="absolute top-3 right-3">
                                    <Badge
                                      className={`${
                                        book.available === 0
                                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                          : book.available < book.stock / 3
                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      } backdrop-blur-sm bg-opacity-90`}
                                    >
                                      {book.available === 0
                                        ? "Indisponível"
                                        : book.available < book.stock / 3
                                          ? "Poucos"
                                          : "Disponível"}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Informações do livro */}
                                <div className="p-4 pb-2">
                                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                                    {book.title}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    <span className="font-medium">por</span> {book.author}
                                  </p>
                                </div>
                              </CardHeader>

                              <CardContent className="p-4 pt-2 space-y-3">
                                {book.isbn && (
                                  <p className="text-gray-500 dark:text-gray-400 text-xs">ISBN: {book.isbn}</p>
                                )}

                                <div>
                                  <div className="flex items-center justify-between mb-2">
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
                                      style={{ width: `${Math.max((book.available / book.stock) * 100, 5)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </CardContent>

                              <CardFooter className="p-4 pt-0">
                                {book.available > 0 ? (
                                  <Button
                                    onClick={() => openBorrowModal(book.id)}
                                    className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                                  >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Emprestar
                                  </Button>
                                ) : (
                                  <Button
                                    disabled
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed py-2.5 rounded-lg"
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Indisponível
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>

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
              </>
            ) : (
              renderWelcomeSection()
            )}
          </main>
        </SidebarInset>
      </div>

      <BorrowModal
        isOpen={isModalOpen}
        onClose={closeModal}
        bookId={selectedBookId || ""}
        libraryId={library.id}
        slug={params.slug}
        user={user}
      />
    </SidebarProvider>
  )
}
