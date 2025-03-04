"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"

interface RecentLoan {
  id: string
  book: string
  user: string
  date: string
  dueDate: string
  status: string
}

export function RecentLoansTable({
  loans,
  loading,
}: {
  loans: RecentLoan[]
  loading: boolean
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768) // Define o breakpoint em 768px (md)
    }

    handleResize() // Verifica o tamanho inicial da tela
    window.addEventListener("resize", handleResize) // Adiciona listener de redimensionamento
    return () => window.removeEventListener("resize", handleResize) // Limpa o listener ao desmontar
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Ativo</Badge>
      case "returned":
        return <Badge className="bg-blue-500">Devolvido</Badge>
      case "overdue":
        return <Badge className="bg-red-500">Atrasado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const renderMobileView = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
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
          <Card key={loan.id} className="p-4">
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Livro</TableHead>
              <TableHead className="whitespace-nowrap">Usuário</TableHead>
              <TableHead className="whitespace-nowrap">Data</TableHead>
              <TableHead className="whitespace-nowrap">Vencimento</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id}>
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
    <Card className="w-full h-max">
      <CardHeader>
        <CardTitle>Empréstimos Recentes</CardTitle>
        <CardDescription>Os últimos 5 empréstimos registrados no sistema</CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "" : "overflow-x-auto"}>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  )
}

