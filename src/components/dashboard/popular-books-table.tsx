"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { BookMarked, MoreVertical, Download, Eye, Edit, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PopularBook {
  id: string
  title: string
  author: string
  loans: number
  available: number
  stock: number
}

export function PopularBooksTable({ books = [], loading }: { books: PopularBook[]; loading: boolean }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const getAvailabilityColor = (available: number, stock: number) => {
    const ratio = available / stock
    if (ratio > 0.7) return "bg-teal-500"
    if (ratio > 0.3) return "bg-amber-500"
    return "bg-rose-500"
  }

  const renderMobileView = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 border-0 shadow-sm">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )
    }

    if (!books || books.length === 0) {
      return <div className="p-4 text-center text-gray-500">Nenhum livro popular encontrado.</div>
    }

    return (
      <div className="space-y-4">
        {books.map((book) => (
          <Card key={book.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
              <div className="font-medium text-base flex items-center gap-2 text-gray-800">
                <BookMarked className="h-4 w-4 text-violet-600" />
                {book.title}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu de opções</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2">
                    <Eye className="h-4 w-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Edit className="h-4 w-4" />
                    Editar livro
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar estoque
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Autor:</span>
                {book.author}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Empréstimos:</span>
                <span className="font-semibold">{book.loans}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Disponibilidade:</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(book.available / book.stock) * 100}
                    className={`h-2 w-16 ${getAvailabilityColor(book.available, book.stock)}`}
                  />
                  <span className="text-sm font-semibold">
                    {book.available}/{book.stock}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const renderDesktopView = () => {
    if (loading) {
      return (
        <div className="w-full space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex w-full items-center space-x-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      )
    }

    if (!books || books.length === 0) {
      return <div className="p-4 text-center text-gray-500">Nenhum livro popular encontrado.</div>
    }

    return (
      <div className="rounded-md border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-sm font-medium text-gray-600">Título</TableHead>
              <TableHead className="text-sm font-medium text-gray-600">Autor</TableHead>
              <TableHead className="text-sm font-medium text-gray-600">Empréstimos</TableHead>
              <TableHead className="text-sm font-medium text-gray-600">Disponibilidade</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id} className="hover:bg-gray-50 transition-colors duration-150">
                <TableCell className="font-medium text-sm flex items-center gap-2 text-gray-800">
                  <BookMarked className="h-4 w-4 text-violet-600" />
                  {book.title}
                </TableCell>
                <TableCell className="text-sm text-gray-600">{book.author}</TableCell>
                <TableCell className="text-sm font-semibold text-gray-700">{book.loans}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress
                      value={(book.available / book.stock) * 100}
                      className={`h-2 ${getAvailabilityColor(book.available, book.stock)}`}
                    />
                    <span className="text-sm font-semibold">
                      {book.available}/{book.stock}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Menu de opções</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" />
                        Editar livro
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar estoque
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-violet-50 p-2">
              <BookMarked className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">Livros Mais Populares</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Os 5 livros mais emprestados da biblioteca
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu de opções</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <Download className="h-4 w-4" />
                Exportar como CSV
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Eye className="h-4 w-4" />
                Ver todos os livros
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>{isMobile ? renderMobileView() : renderDesktopView()}</CardContent>
    </Card>
  )
}
