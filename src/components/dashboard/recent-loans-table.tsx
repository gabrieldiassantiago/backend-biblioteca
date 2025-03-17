"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { ClipboardList } from 'lucide-react'

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
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativo</Badge>
      case "returned":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Devolvido</Badge>
      case "overdue":
        return <Badge className="bg-rose-500 hover:bg-rose-600">Atrasado</Badge>
      case "pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pendente</Badge>
      case "rejected":
        return <Badge className="bg-slate-500 hover:bg-slate-600">Rejeitado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const renderMobileView = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 border border-border/50">
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
          <Card key={loan.id} className="p-4 border border-border/50 hover:border-primary/20 transition-colors">
            <div className="font-medium text-lg mb-2">{loan.book}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Usuário:</div>
              <div>{loan.user}</div>
              <div className="text-muted-foreground">Data:</div>
              <div>{formatDate(loan.date)}</div>
              <div className="text-muted-foreground">Vencimento:</div>
              <div>{formatDate(loan.dueDate)}</div>
              <div className="text-muted-foreground">Status:</div>
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
      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap font-medium">Livro</TableHead>
              <TableHead className="whitespace-nowrap font-medium">Usuário</TableHead>
              <TableHead className="whitespace-nowrap font-medium">Data</TableHead>
              <TableHead className="whitespace-nowrap font-medium">Vencimento</TableHead>
              <TableHead className="whitespace-nowrap font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id} className="hover:bg-muted/30">
                <TableCell className="font-medium whitespace-nowrap">{loan.book}</TableCell>
                <TableCell className="whitespace-nowrap">{loan.user}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(loan.date)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(loan.dueDate)}</TableCell>
                <TableCell>{getStatusBadge(loan.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-card to-card/80 shadow-md transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Empréstimos Recentes</CardTitle>
          <CardDescription>Os últimos 5 empréstimos registrados no sistema</CardDescription>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <ClipboardList className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "" : "overflow-x-auto"}>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  )
}
