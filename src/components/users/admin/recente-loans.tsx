import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BookOpen, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Book {
  id: string
  title: string
  author: string
}

interface Loan {
  id: string
  borrowed_at: string
  returned_at: string | null
  due_date: string
  status: "active" | "returned" | "overdue" | "lost"
  book: Book
}

interface RecentLoansProps {
  loans: Loan[]
  userId: string
}

export function RecentLoans({ loans, userId }: RecentLoansProps) {
  if (!loans || loans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">Nenhum empréstimo encontrado</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Este aluno ainda não realizou empréstimos na biblioteca.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === "active"

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Atrasado</span>
        </Badge>
      )
    }

    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Ativo</span>
          </Badge>
        )
      case "returned":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Devolvido</span>
          </Badge>
        )
      case "lost":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Perdido</span>
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("pt-BR")
    }
    catch  {
      return ""
    }

  }

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch  {
      return ""
    }
  }

  return (
    <div className="space-y-4">
      {loans.map((loan) => (
        <Card
          key={loan.id}
          className="p-6 flex flex-col lg:flex-row gap-4 hover:bg-muted/30 transition-all duration-200 border-0 shadow-sm"
        >
          <div className="flex-shrink-0">
            <div className="relative h-24 w-16 lg:h-32 lg:w-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg line-clamp-2 text-gray-900">{loan.book.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{loan.book.author}</p>
              </div>
              <div className="flex-shrink-0">{getStatusBadge(loan.status, loan.due_date)}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>
                  <strong>Emprestado:</strong> {formatDate(loan.borrowed_at)}
                </span>
                <span className="text-xs">({getTimeAgo(loan.borrowed_at)})</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-amber-500" />
                <span>
                  <strong>Devolução:</strong> {formatDate(loan.due_date)}
                </span>
              </div>
            </div>

            {loan.returned_at && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <span>
                  <strong>Devolvido em:</strong> {formatDate(loan.returned_at)}
                </span>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hover:bg-primary hover:text-white transition-colors"
              >
                <Link href={`/admin/loans/${loan.id}`}>Ver detalhes do empréstimo</Link>
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <div className="flex justify-center pt-4">
        <Button variant="outline" asChild className="bg-primary text-white hover:bg-primary/90">
          <Link href={`/admin/loans?user=${userId}`}>Ver todos os empréstimos</Link>
        </Button>
      </div>
    </div>
  )
}
