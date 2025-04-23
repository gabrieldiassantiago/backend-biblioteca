"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { ClipboardList, BookOpen, User, Calendar, Clock, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

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
        return <Badge className="bg-emerald-600 text-white text-xs font-medium px-2 py-0.5 border-0">Ativo</Badge>
      case "returned":
        return <Badge className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 border-0">Devolvido</Badge>
      case "overdue":
        return <Badge className="bg-rose-600 text-white text-xs font-medium px-2 py-0.5 border-0">Atrasado</Badge>
      case "pending":
        return <Badge className="bg-amber-600 text-white text-xs font-medium px-2 py-0.5 border-0">Pendente</Badge>
      case "rejected":
        return <Badge className="bg-slate-600 text-white text-xs font-medium px-2 py-0.5 border-0">Rejeitado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const renderMobileView = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 border border-gray-200 shadow-sm">
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
            className="p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="font-medium text-base flex items-center gap-2 text-gray-800">
                <BookOpen className="h-4 w-4 text-indigo-700" />
                {loan.book}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                    <span className="sr-only">Menu de opções</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                  <DropdownMenuItem>Renovar empréstimo</DropdownMenuItem>
                  <DropdownMenuItem>Marcar como devolvido</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">Usuário:</span>
                {loan.user}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">Data:</span>
                {formatDate(loan.date)}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">Vencimento:</span>
                {formatDate(loan.dueDate)}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-medium">Status:</span>
                {getStatusBadge(loan.status)}
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
      <div className="rounded-md border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-sm font-medium text-gray-700">Livro</TableHead>
              <TableHead className="text-sm font-medium text-gray-700">Usuário</TableHead>
              <TableHead className="text-sm font-medium text-gray-700">Data</TableHead>
              <TableHead className="text-sm font-medium text-gray-700">Vencimento</TableHead>
              <TableHead className="text-sm font-medium text-gray-700">Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id} className="hover:bg-gray-50 transition-colors duration-150">
                <TableCell className="font-medium text-sm flex items-center gap-2 text-gray-800">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  {loan.book}
                </TableCell>
                <TableCell className="text-sm text-gray-700">{loan.user}</TableCell>
                <TableCell className="text-sm text-gray-700">{formatDate(loan.date)}</TableCell>
                <TableCell className="text-sm text-gray-700">{formatDate(loan.dueDate)}</TableCell>
                <TableCell>{getStatusBadge(loan.status)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                        <span className="sr-only">Menu de opções</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/loans/${loan.id}`}>Ver detalhes</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Renovar empréstimo</DropdownMenuItem>
                      <DropdownMenuItem>Marcar como devolvido</DropdownMenuItem>
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
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <ClipboardList className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">Empréstimos Recentes</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Os últimos 5 empréstimos registrados no sistema
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <MoreVertical className="h-4 w-4 text-gray-500" />
                <span className="sr-only">Menu de opções</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Exportar como CSV</DropdownMenuItem>
              <DropdownMenuItem>Ver todos os empréstimos</DropdownMenuItem>
              <DropdownMenuItem>Atualizar dados</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>{isMobile ? renderMobileView() : renderDesktopView()}</CardContent>
    </Card>
  )
}

