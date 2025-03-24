"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { ClipboardList, BookOpen, User } from 'lucide-react'

interface RecentLoan {
  id: string
  book: string
  user: string
  date: string
  dueDate: string
  status: string
}

export function RecentLoansTable({ loans, loading }: { loans: RecentLoan[]; loading: boolean }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500 text-white text-sm font-bold px-3 py-1">
            Ativo
          </Badge>
        )
      case "returned":
        return (
          <Badge className="bg-blue-500 text-white text-sm font-bold px-3 py-1">
            Devolvido
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-rose-500 text-white text-sm font-bold px-3 py-1">
            Atrasado
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-500 text-white text-sm font-bold px-3 py-1">
            Pendente
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-slate-500 text-white text-sm font-bold px-3 py-1">
            Rejeitado
          </Badge>
        )
      default:
        return <Badge>Desconhecido</Badge>
    }
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
        {loans.map((loan) => (
          <Card 
            key={loan.id} 
            className="p-4 border-2"
          >
            <div className="font-medium text-lg mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {loan.book}
            </div>
            <div className="grid grid-cols-2 gap-2 text-base">
              <div className="font-medium">Usuário:</div>
              <div>{loan.user}</div>
              <div className="font-medium">Data:</div>
              <div>{formatDate(loan.date)}</div>
              <div className="font-medium">Vencimento:</div>
              <div>{formatDate(loan.dueDate)}</div>
              <div className="font-medium">Status:</div>
              <div>{getStatusBadge(loan.status)}</div>
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
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
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
              <TableHead className="text-base font-bold">Livro</TableHead>
              <TableHead className="text-base font-bold">Usuário</TableHead>
              <TableHead className="text-base font-bold">Data</TableHead>
              <TableHead className="text-base font-bold">Vencimento</TableHead>
              <TableHead className="text-base font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow 
                key={loan.id} 
                className="hover:bg-muted/30"
              >
                <TableCell className="font-medium text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {loan.book}
                </TableCell>
                <TableCell className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {loan.user}
                </TableCell>
                <TableCell className="text-base">{formatDate(loan.date)}</TableCell>
                <TableCell className="text-base">{formatDate(loan.dueDate)}</TableCell>
                <TableCell>{getStatusBadge(loan.status)}</TableCell>
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
            <ClipboardList className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-bold">Empréstimos Recentes</CardTitle>
          </div>
        </div>
        <CardDescription className="text-base mt-1">
          Os últimos 5 empréstimos registrados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  )
}
