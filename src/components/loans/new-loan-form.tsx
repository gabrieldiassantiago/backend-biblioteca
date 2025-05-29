"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Loader2, PlusCircle, BookOpen, User, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchBooks, searchUsers, createNewLoan } from "../../app/(admin)/admin/loans/actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Book {
  id: string
  title: string
  author?: string
  available: number
  stock: number
}

interface AppUser {
  id: string
  full_name: string
  email?: string
  role: string
  average_rating?: number
}

export function NewLoanModal() {
  const [open, setOpen] = useState(false)
  const [bookSearchOpen, setBookSearchOpen] = useState(false)
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [bookQuery, setBookQuery] = useState("")
  const [userQuery, setUserQuery] = useState("")
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)

  const [isSearchingBooks, startSearchingBooks] = useTransition()
  const [isSearchingUsers, startSearchingUsers] = useTransition()
  const [isCreatingLoan, startCreatingLoan] = useTransition()

  // Busca livros com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bookQuery.trim().length >= 2) {
        startSearchingBooks(async () => {
          const results = await searchBooks(bookQuery)
          setBooks(results || [])
        })
      } else {
        setBooks([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [bookQuery])

  // Busca usuários com média de estrelas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userQuery.trim().length >= 2) {
        startSearchingUsers(async () => {
          const results = await searchUsers(userQuery)
          setUsers(results || [])
        })
      } else {
        setUsers([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [userQuery])

  const handleOpenChange = (openModal: boolean) => {
    if (!openModal) {
      setTimeout(() => {
        setSelectedBook(null)
        setSelectedUser(null)
        setBookQuery("")
        setUserQuery("")
        setBooks([])
        setUsers([])
      }, 100)
    }
    setOpen(openModal)
  }

  const handleCreateLoan = () => {
    if (!selectedBook || !selectedUser) {
      toast.error("Selecione um livro e um usuário")
      return
    }
    startCreatingLoan(async () => {
      try {
        await createNewLoan(selectedBook.id, selectedUser.id)
        toast.success("Empréstimo criado com sucesso!")
        handleOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar empréstimo")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 transition-all shadow-sm" size="lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Novo Empréstimo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 -m-6 mb-6 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PlusCircle className="h-6 w-6 text-primary" />
            </div>
            Novo Empréstimo
          </DialogTitle>
          <p className="text-muted-foreground mt-2">Registre um novo empréstimo de livro para um aluno</p>
        </div>

        <div className="grid gap-8">
          {/* Seleção de Livro */}
          <div className="space-y-3">
            <Label htmlFor="book" className="text-lg font-semibold flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Livro
            </Label>
            <Popover open={bookSearchOpen} onOpenChange={setBookSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={bookSearchOpen}
                  className={cn(
                    "w-full justify-between h-12 border-2 transition-all duration-200",
                    !selectedBook && "text-muted-foreground",
                    bookSearchOpen && "border-primary",
                  )}
                >
                  {selectedBook ? (
                    <div className="flex items-center gap-3 w-full justify-between">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{selectedBook.title}</span>
                        {selectedBook.author && (
                          <span className="text-xs text-muted-foreground">{selectedBook.author}</span>
                        )}
                      </div>
                      {selectedBook.available > 0 ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Disponível: {selectedBook.available}/{selectedBook.stock}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Indisponível
                        </Badge>
                      )}
                    </div>
                  ) : (
                    "Selecione um livro"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0 border-2 shadow-xl rounded-xl" align="start">
                <Command shouldFilter={false}>
                  <div className="flex items-center border-b px-4 py-3">
                    <Search className="mr-3 h-4 w-4 text-muted-foreground" />
                    <CommandInput
                      placeholder="Buscar livro por título..."
                      value={bookQuery}
                      onValueChange={setBookQuery}
                      className="flex-1"
                    />
                    {isSearchingBooks && <Loader2 className="ml-3 h-4 w-4 animate-spin text-primary" />}
                  </div>
                  <CommandEmpty className="py-6 text-center text-sm">
                    {bookQuery.length < 2 ? "Digite pelo menos 2 caracteres para buscar" : "Nenhum livro encontrado"}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[300px]">
                      <CommandList>
                        {books.map((book) => (
                          <CommandItem
                            key={book.id}
                            value={book.title}
                            onSelect={() => {
                              setSelectedBook(book)
                              setBookSearchOpen(false)
                            }}
                            disabled={book.available <= 0}
                            className={cn(
                              "flex items-center justify-between p-4 cursor-pointer",
                              book.available <= 0 && "opacity-50 cursor-not-allowed",
                              selectedBook?.id === book.id && "bg-primary/5",
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{book.title}</span>
                              {book.author && <span className="text-sm text-muted-foreground">{book.author}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {book.available > 0 ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {book.available}/{book.stock}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  Indisponível
                                </Badge>
                              )}
                              {selectedBook?.id === book.id && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Seleção de Usuário */}
          <div className="space-y-3">
            <Label htmlFor="user" className="text-lg font-semibold flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Aluno/Usuário
            </Label>
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSearchOpen}
                  className={cn(
                    "w-full justify-between h-12 border-2 transition-all duration-200",
                    !selectedUser && "text-muted-foreground",
                    userSearchOpen && "border-primary",
                  )}
                >
                  {selectedUser ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{selectedUser.full_name}</span>
                        {selectedUser.email && (
                          <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 font-medium">⭐</span>
                        <span className="text-sm font-medium">{(selectedUser.average_rating ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                  ) : (
                    "Selecione um aluno"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0 border-2 shadow-xl rounded-xl" align="start">
                <Command shouldFilter={false}>
                  <div className="flex items-center border-b px-4 py-3">
                    <Search className="mr-3 h-4 w-4 text-muted-foreground" />
                    <CommandInput
                      placeholder="Buscar aluno por nome..."
                      value={userQuery}
                      onValueChange={setUserQuery}
                      className="flex-1"
                    />
                    {isSearchingUsers && <Loader2 className="ml-3 h-4 w-4 animate-spin text-primary" />}
                  </div>
                  <CommandEmpty className="py-6 text-center text-sm">
                    {userQuery.length < 2 ? "Digite pelo menos 2 caracteres para buscar" : "Nenhum aluno encontrado"}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[300px]">
                      <CommandList>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.full_name}
                            onSelect={() => {
                              setSelectedUser(user)
                              setUserSearchOpen(false)
                            }}
                            className={cn(
                              "flex items-center justify-between p-4 cursor-pointer",
                              selectedUser?.id === user.id && "bg-primary/5",
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{user.full_name}</span>
                              {user.email && <span className="text-sm text-muted-foreground">{user.email}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500 font-medium">⭐</span>
                                <span className="text-sm font-medium">{(user.average_rating ?? 0).toFixed(1)}</span>
                              </div>
                              {selectedUser?.id === user.id && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateLoan}
            disabled={!selectedBook || !selectedUser || isCreatingLoan}
            className="w-full sm:w-auto order-1 sm:order-2 bg-primary hover:bg-primary/90 transition-all"
          >
            {isCreatingLoan ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Empréstimo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
