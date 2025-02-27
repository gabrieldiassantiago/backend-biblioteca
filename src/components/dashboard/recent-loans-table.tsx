"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Dados fictícios para demonstração
const recentLoans = [
  {
    id: "1",
    book: "O Senhor dos Anéis",
    user: "João Silva",
    date: "2023-05-15",
    dueDate: "2023-06-15",
    status: "active"
  },
  {
    id: "2",
    book: "Harry Potter e a Pedra Filosofal",
    user: "Maria Oliveira",
    date: "2023-05-10",
    dueDate: "2023-06-10",
    status: "returned"
  },
  {
    id: "3",
    book: "1984",
    user: "Pedro Santos",
    date: "2023-04-20",
    dueDate: "2023-05-20",
    status: "overdue"
  },
  {
    id: "4",
    book: "Dom Quixote",
    user: "Ana Pereira",
    date: "2023-05-05",
    dueDate: "2023-06-05",
    status: "active"
  },
  {
    id: "5",
    book: "A Metamorfose",
    user: "Carlos Mendes",
    date: "2023-05-01",
    dueDate: "2023-06-01",
    status: "returned"
  }
]

export function RecentLoansTable() {
  // Função para formatar a data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
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
      <CardDescription>
        Os últimos 5 empréstimos registrados no sistema
      </CardDescription>
    </CardHeader>
    <CardContent className="overflow-x-auto">
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
    </CardContent>
  </Card>
  )
}