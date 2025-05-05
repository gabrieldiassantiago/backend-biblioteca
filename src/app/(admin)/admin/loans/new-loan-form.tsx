"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  PlusCircle,
  BookOpen,
  User,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { searchBooks, searchUsers, createNewLoan } from "@/app/(admin)/admin/loans/actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Book {
  id: string;
  title: string;
  author?: string;
  available: number;
  stock: number;
}

interface AppUser {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  average_rating?: number; // Média de avaliações do usuário
}

export function NewLoanModal() {
  const [open, setOpen] = useState(false);
  const [bookSearchOpen, setBookSearchOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [bookQuery, setBookQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  const [isSearchingBooks, startSearchingBooks] = useTransition();
  const [isSearchingUsers, startSearchingUsers] = useTransition();
  const [isCreatingLoan, startCreatingLoan] = useTransition();

  // Busca livros com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bookQuery.trim().length >= 2) {
        startSearchingBooks(async () => {
          const results = await searchBooks(bookQuery);
          setBooks(results || []);
        });
      } else {
        setBooks([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [bookQuery]);

  // Busca usuários com média de estrelas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userQuery.trim().length >= 2) {
        startSearchingUsers(async () => {
          const results = await searchUsers(userQuery);
          setUsers(results || []);
        });
      } else {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  const handleOpenChange = (openModal: boolean) => {
    if (!openModal) {
      setTimeout(() => {
        setSelectedBook(null);
        setSelectedUser(null);
        setBookQuery("");
        setUserQuery("");
        setBooks([]);
        setUsers([]);
      }, 100);
    }
    setOpen(openModal);
  };

  const handleCreateLoan = () => {
    if (!selectedBook || !selectedUser) {
      toast.error("Selecione um livro e um usuário");
      return;
    }
    startCreatingLoan(async () => {
      try {
        await createNewLoan(selectedBook.id, selectedUser.id);
        toast.success("Empréstimo criado com sucesso!");
        handleOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar empréstimo");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Empréstimo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-xl">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <DialogTitle className="text-xl font-semibold">Novo Empréstimo</DialogTitle>
          <p className="text-blue-100 mt-1 text-sm">Registre um novo empréstimo de livro</p>
        </div>
        <div className="grid gap-6 p-6">
          {/* Seleção de Livro */}
          <div className="grid gap-2">
            <Label htmlFor="book" className="text-sm font-medium flex items-center">
              <BookOpen className="h-4 w-4 mr-1.5 text-blue-600" />
              Livro
            </Label>
            <Popover open={bookSearchOpen} onOpenChange={setBookSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={bookSearchOpen}
                  className={cn(
                    "justify-between border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all",
                    !selectedBook && "text-gray-500"
                  )}
                >
                  {selectedBook ? (
                    <div className="flex items-center gap-2 w-full justify-between">
                      <span className="truncate">{selectedBook.title}</span>
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
              <PopoverContent className="p-0 w-[400px] border border-gray-200 shadow-lg rounded-lg" align="start">
                <Command shouldFilter={false}>
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 text-gray-400" />
                    <CommandInput
                      placeholder="Buscar livro..."
                      value={bookQuery}
                      onValueChange={setBookQuery}
                      className="h-10 flex-1"
                    />
                    {isSearchingBooks && <Loader2 className="ml-2 h-4 w-4 animate-spin text-blue-600" />} 
                  </div>
                  <CommandEmpty>
                    {bookQuery.length < 2 ? "Digite pelo menos 2 caracteres para buscar" : "Nenhum livro encontrado"}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[240px]">
                      <CommandList>
                        {books.map((book) => (
                          <CommandItem
                            key={book.id}
                            value={book.title}
                            onSelect={() => {
                              setSelectedBook(book);
                              setBookSearchOpen(false);
                            }}
                            disabled={book.available <= 0}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 cursor-pointer",
                              book.available <= 0 && "opacity-50 cursor-not-allowed",
                              selectedBook?.id === book.id && "bg-blue-50"
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{book.title}</span>
                              {book.author && <span className="text-xs text-gray-500">{book.author}</span>}
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
                              {selectedBook?.id === book.id && <Check className="h-4 w-4 text-blue-600" />}
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
          <div className="grid gap-2">
            <Label htmlFor="user" className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-1.5 text-blue-600" />
              Aluno/Usuário
            </Label>
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSearchOpen}
                  className={cn(
                    "justify-between border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all",
                    !selectedUser && "text-gray-500"
                  )}
                >
                  {selectedUser ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{selectedUser.full_name}</span>
                      <span className="text-yellow-500 font-medium">⭐
                        { (selectedUser.average_rating ?? 0).toFixed(1) }
                      </span>
                    </div>
                  ) : (
                    "Selecione um aluno"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[400px] border border-gray-200 shadow-lg rounded-lg" align="start">
                <Command shouldFilter={false}>
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 text-gray-400" />
                    <CommandInput
                      placeholder="Buscar aluno..."
                      value={userQuery}
                      onValueChange={setUserQuery}
                      className="h-10 flex-1"
                    />
                    {isSearchingUsers && <Loader2 className="ml-2 h-4 w-4 animate-spin text-blue-600" />} 
                  </div>
                  <CommandEmpty>
                    {userQuery.length < 2 ? "Digite pelo menos 2 caracteres para buscar" : "Nenhum aluno encontrado"}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[240px]">
                      <CommandList>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.full_name}
                            onSelect={() => {
                              setSelectedUser(user);
                              setUserSearchOpen(false);
                            }}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 cursor-pointer",
                              selectedUser?.id === user.id && "bg-blue-50"
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{user.full_name}</span>
                              {user.email && <span className="text-xs text-gray-500">{user.email}</span>}
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-500 font-medium">⭐
                                { (user.average_rating ?? 0).toFixed(1) }
                              </span>
                              {selectedUser?.id === user.id && <Check className="h-4 w-4 text-blue-600" />}
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
        <DialogFooter className="p-6 pt-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-gray-300 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateLoan}
            disabled={!selectedBook || !selectedUser || isCreatingLoan}
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
          >
            {isCreatingLoan ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" /> Criar Empréstimo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}