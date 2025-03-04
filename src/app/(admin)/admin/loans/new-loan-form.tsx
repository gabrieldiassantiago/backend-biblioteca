"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { Check, ChevronsUpDown, Loader2, PlusCircle } from 'lucide-react';
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

interface User {
  id: string;
  full_name: string;
  email?: string;
  role: string;
}

export function NewLoanModal() {
  const [open, setOpen] = useState(false);
  const [bookSearchOpen, setBookSearchOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [bookQuery, setBookQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [isSearchingBooks, startSearchingBooks] = useTransition();
  const [isSearchingUsers, startSearchingUsers] = useTransition();
  const [isCreatingLoan, startCreatingLoan] = useTransition();

  useEffect(() => {
    if (bookQuery.trim().length >= 2) {
      startSearchingBooks(async () => {
        const results = await searchBooks(bookQuery);
        console.log("Results:", results);
        setBooks(results || []);
      });
    } else {
      setBooks([]);
    }
  }, [bookQuery]);

  useEffect(() => {
    if (userQuery.trim().length >= 2) {
      startSearchingUsers(async () => {
        const results = await searchUsers(userQuery);
        setUsers(results || []);
      });
    } else {
      setUsers([]);
    }
  }, [userQuery]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => {
        setSelectedBook(null);
        setSelectedUser(null);
        setBookQuery("");
        setUserQuery("");
        setBooks([]);
        setUsers([]);
      }, 100);
    }
    setOpen(newOpen);
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
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao criar empréstimo");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Empréstimo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Empréstimo</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Seleção de Livro */}
          <div className="grid gap-2">
            <Label htmlFor="book">Livro</Label>
            <Popover open={bookSearchOpen} onOpenChange={setBookSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={bookSearchOpen}
                  className={cn(
                    "justify-between",
                    !selectedBook && "text-muted-foreground"
                  )}
                >
                  {selectedBook ? (
                    <div className="flex items-center gap-2 text-left">
                      <span className="truncate">{selectedBook.title}</span>
                      {selectedBook.available > 0 ? (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                          Disponível: {selectedBook.available}/{selectedBook.stock}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
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
              <PopoverContent className="p-0 w-[400px]">
                <Command shouldFilter={false}>
                  <div className="flex items-center border-b px-3">
                    <CommandInput
                      placeholder="Buscar livro..."
                      value={bookQuery}
                      onValueChange={setBookQuery}
                      className="h-9 flex-1"
                    />
                    {isSearchingBooks && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  </div>
                  <CommandEmpty>
                    {bookQuery.length < 2 
                      ? "Digite pelo menos 2 caracteres para buscar" 
                      : "Nenhum livro encontrado"}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
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
                              "flex items-center justify-between",
                              book.available <= 0 && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex flex-col">
                              <span>{book.title}</span>
                              {book.author && (
                                <span className="text-xs text-muted-foreground">
                                  {book.author}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              {book.available > 0 ? (
                                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                  {book.available}/{book.stock}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                                  Indisponível
                                </Badge>
                              )}
                              {selectedBook?.id === book.id && (
                                <Check className="ml-2 h-4 w-4" />
                              )}
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
            <Label htmlFor="user">Aluno/Usuário</Label>
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSearchOpen}
                  className={cn(
                    "justify-between",
                    !selectedUser && "text-muted-foreground"
                  )}
                >
                  {selectedUser ? (
                    <div className="flex items-center text-left">
                      <span className="truncate">{selectedUser.full_name}</span>
                    </div>
                  ) : (
                    "Selecione um aluno"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[400px]">
                <Command shouldFilter={false}>
                  <div className="flex items-center border-b px-3">
                    <CommandInput
                      placeholder="Buscar aluno..."
                      value={userQuery}
                      onValueChange={setUserQuery}
                      className="h-9 flex-1"
                    />
                    {isSearchingUsers && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  </div>
                  <CommandEmpty>
                    {userQuery.length < 2 
                      ? "Digite pelo menos 2 caracteres para buscar" 
                      : "Nenhum aluno encontrado"}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      <CommandList>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.full_name}
                            onSelect={() => {
                              setSelectedUser(user);
                              setUserSearchOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{user.full_name}</span>
                              {user.email && (
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              )}
                            </div>
                            {selectedUser?.id === user.id && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
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
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateLoan}
            disabled={!selectedBook || !selectedUser || isCreatingLoan}
            className="ml-2"
          >
            {isCreatingLoan ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Empréstimo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}