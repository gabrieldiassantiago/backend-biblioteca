"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { TrendingUp, BookMarked } from "lucide-react"

interface PopularBook {
  id: string
  title: string
  author: string
  loans: number
  available: number
  stock: number
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

  const getAvailabilityColor = (available: number, stock: number) => {
    const ratio = available / stock
    if (ratio > 0.7) return "bg-emerald-500"
    if (ratio > 0.3) return "bg-amber-500"
    return "bg-rose-500"
  }

  const renderMobileView = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 border border-border">
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

    return (
      <div className="space-y-4">
        {books.map((book) => (
          <Card key={book.id} className="p-4 border-2">
            <div className="font-medium text-lg mb-2 flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-primary" />
              {book.title}
            </div>
            <div className="grid grid-cols-2 gap-2 text-base">
              <div className="font-medium">Autor:</div>
              <div>{book.author}</div>
              <div className="font-medium">Empréstimos:</div>
              <div className="font-bold">{book.loans}</div>
              <div className="font-medium">Disponibilidade:</div>
              <div className="flex items-center gap-2">
                <Progress
                  value={(book.available / book.stock) * 100}
                  className={`h-3 w-16 ${getAvailabilityColor(book.available, book.stock)}`}
                />
                <span className="text-sm font-bold whitespace-nowrap">
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
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="rounded-md border-2">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-base font-bold">Título</TableHead>
              <TableHead className="text-base font-bold">Autor</TableHead>
              <TableHead className="text-base font-bold">Empréstimos</TableHead>
              <TableHead className="text-base font-bold">Disponibilidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id} className="hover:bg-muted/30">
                <TableCell className="font-medium text-base flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-primary" />
                  {book.title}
                </TableCell>
                <TableCell className="text-base">{book.author}</TableCell>
                <TableCell className="font-bold text-base">{book.loans}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress
                      value={(book.available / book.stock) * 100}
                      className={`h-3 ${getAvailabilityColor(book.available, book.stock)}`}
                    />
                    <span className="text-sm font-bold whitespace-nowrap">
                      {book.available}/{book.stock}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-bold">Livros Mais Populares</CardTitle>
          </div>
        </div>
        <CardDescription className="text-base mt-1">Os 5 livros mais emprestados da biblioteca</CardDescription>
      </CardHeader>
      <CardContent>{isMobile ? renderMobileView() : renderDesktopView()}</CardContent>
    </Card>
  )
}

