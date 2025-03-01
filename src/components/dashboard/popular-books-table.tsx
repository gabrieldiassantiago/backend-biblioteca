"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"

interface PopularBook {
  id: string;
  title: string;
  author: string;
  loans: number;
  available: number;
  stock: number;
}

export function PopularBooksTable({ books, loading }: { books: PopularBook[]; loading: boolean }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const renderMobileView = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted mb-4"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
              </div>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {books.map((book) => (
          <Card key={book.id} className="p-4">
            <div className="font-medium text-lg mb-2">{book.title}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Autor:</div>
              <div>{book.author}</div>
              <div className="text-muted-foreground">Empréstimos:</div>
              <div>{book.loans}</div>
              <div className="text-muted-foreground">Disponibilidade:</div>
              <div className="flex items-center gap-2">
                <Progress value={(book.available / book.stock) * 100} className="h-2 w-16" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {book.available}/{book.stock}
                </span>
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
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted"></div>
              <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
              <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
              <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Título</TableHead>
            <TableHead className="whitespace-nowrap">Autor</TableHead>
            <TableHead className="whitespace-nowrap">Empréstimos</TableHead>
            <TableHead className="whitespace-nowrap">Disponibilidade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => (
            <TableRow key={book.id}>
              <TableCell className="font-medium whitespace-nowrap">{book.title}</TableCell>
              <TableCell className="whitespace-nowrap">{book.author}</TableCell>
              <TableCell className="whitespace-nowrap">{book.loans}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress value={(book.available / book.stock) * 100} className="h-2" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {book.available}/{book.stock}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Livros Mais Populares</CardTitle>
        <CardDescription>Os 5 livros mais emprestados da biblioteca</CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "" : "overflow-x-auto"}>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  )
}