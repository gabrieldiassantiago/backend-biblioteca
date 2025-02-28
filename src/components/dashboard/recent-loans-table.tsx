"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { getRecentLoans } from "@/app/(admin)/admin/books/actions"

interface RecentLoan {
  id: string
  book: string
  user: string
  date: string
  dueDate: string
  status: string
}

export function RecentLoansTable() {
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loans = await getRecentLoans()
        setRecentLoans(loans)
      } catch (error) {
        console.error("Erro ao carregar empréstimos recentes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  // Função para obter a cor do status
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

  return (
    <Card className="w-full h-max">
      <CardHeader>
        <CardTitle>Empréstimos Recentes</CardTitle>
        <CardDescription>Os últimos 5 empréstimos registrados no sistema</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="w-full space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex w-full items-center space-x-4">
                <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
              </div>
            ))}
          </div>
        ) : (
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
              {recentLoans.map((loan) => (
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
        )}
      </CardContent>
    </Card>
  )
}

