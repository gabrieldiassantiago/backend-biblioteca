import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Eye, BookOpen, Users, TrendingUp, Clock } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getUserLibraryId } from "./actions"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { NewLoanModal } from "../../../../components/loans/new-loan-form"
import { LoansStatusFilter } from "../../../../components/loans/loans-status-filter"
import { UpdateLoanForm } from "@/components/loans/update-loan-form"
import { PaginationControls } from "../../../../components/loans/pagination-controls"

// Interfaces
interface RawLoan {
  id: string
  user_id: string
  book_id: string
  library_id: string
  borrowed_at: string
  due_date: string
  returned_at: string | null
  status: "pending" | "active" | "returned" | "overdue" | "rejected"
  books?: { title: string }[]
  users?: { full_name: string }[]
}

interface FormattedLoan {
  id: string
  user_id: string
  book_id: string
  library_id: string
  borrowed_at: string
  due_date: string
  returned_at: string | null
  status: "pending" | "active" | "returned" | "overdue" | "rejected"
  book_title: string
  user_name: string
}

// Skeleton Components
function LoanListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card className="border-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Livro</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Data de Empréstimo</TableHead>
              <TableHead>Data de Devolução</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function StatsSkeletonLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Stats Component
async function LoansStats() {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  const { data: loans } = await supabase.from("loans").select("status").eq("library_id", libraryId)

  if (!loans) return null

  const stats = {
    total: loans.length,
    active: loans.filter((l) => l.status === "active").length,
    pending: loans.filter((l) => l.status === "pending").length,
    overdue: loans.filter((l) => l.status === "overdue").length,
  }

  const statCards = [
    {
      title: "Total de Empréstimos",
      value: stats.total,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      description: "registrados",
    },
    {
      title: "Empréstimos Ativos",
      value: stats.active,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      description: "em andamento",
    },
    {
      title: "Pendentes",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      description: "aguardando aprovação",
    },
    {
      title: "Atrasados",
      value: stats.overdue,
      icon: Users,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      description: "precisam atenção",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface LoansPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number.parseInt((resolvedSearchParams.page as string) || "1", 10))
  const statusFilter = (resolvedSearchParams.status as string) || "all"
  const searchFilter = (resolvedSearchParams.search as string) || ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">Empréstimos</h1>
                  <p className="text-lg text-muted-foreground">Gerencie o histórico de empréstimos da biblioteca</p>
                </div>
              </div>
            </div>

            <NewLoanModal />
          </div>

          {/* Quick Stats */}
          <Suspense fallback={<StatsSkeletonLoader />}>
            <LoansStats />
          </Suspense>
        </div>

        {/* Filters Section */}
        <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <LoansStatusFilter currentSearch={searchFilter} currentStatus={statusFilter} />
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {statusFilter !== "all" && (
                <span className="flex items-center gap-1">
                  Filtrado por: <strong className="text-foreground">{statusFilter}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Loans Table */}
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <Suspense fallback={<LoanListSkeleton />}>
              <LoansTable searchFilter={searchFilter} page={page} statusFilter={statusFilter} />
            </Suspense>
          </Card>
        </div>
      </div>
    </div>
  )
}

async function LoansTable({ page, statusFilter }: { page: number; statusFilter: string; searchFilter: string }) {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()
  const pageSize = 10
  const offset = (page - 1) * pageSize

  // Contagem
  let countQuery = supabase.from("loans").select("*", { count: "exact", head: true }).eq("library_id", libraryId)
  if (statusFilter !== "all") {
    countQuery = countQuery.eq("status", statusFilter)
  }
  const { count } = await countQuery

  // Busca
  let loansQuery = supabase
    .from("loans")
  .select(`
    id,
    user_id,
    book_id,
    library_id,
    borrowed_at,
    due_date,
    returned_at,
    status,
    books:book_id (title),
    users:user_id (full_name)
  `)
  .eq("library_id", libraryId)

  if (statusFilter !== "all") {
    loansQuery = loansQuery.eq("status", statusFilter)
  }


  const { data: loans, error } = await loansQuery
    .range(offset, offset + pageSize - 1)
    .order("borrowed_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar empréstimos:", error.message)
    throw new Error("Erro ao carregar histórico: " + error.message)
  }

  const formattedLoans: FormattedLoan[] = await Promise.all(
    (loans || []).map(async (loan: RawLoan) => {
      let bookTitle = "Título não encontrado"
      let userName = "Usuário não encontrado"

      if (loan.books && loan.books.length > 0 && loan.books[0].title) {
        bookTitle = loan.books[0].title
      } else {
        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .select("title")
          .eq("id", loan.book_id)
          .single()

        if (bookError) {
          console.error(`Erro ao buscar livro ${loan.book_id}:`, bookError.message)
        } else if (bookData) {
          bookTitle = bookData.title
        }
      }

      if (loan.users && loan.users.length > 0 && loan.users[0].full_name) {
        userName = loan.users[0].full_name
      } else {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", loan.user_id)
          .single()

        if (userError) {
          console.error(`Erro ao buscar usuário ${loan.user_id}:`, userError.message)
        } else if (userData) {
          userName = userData.full_name
        }
      }

      return {
        id: loan.id,
        user_id: loan.user_id,
        book_id: loan.book_id,
        library_id: loan.library_id,
        borrowed_at: loan.borrowed_at,
        due_date: loan.due_date,
        returned_at: loan.returned_at,
        status: loan.status,
        book_title: bookTitle,
        user_name: userName,
      }
    }),
  )

  const totalPages = Math.ceil((count || 0) / pageSize)

  if (!formattedLoans.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-12 h-12 text-gray-400" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Nenhum empréstimo encontrado</h3>
          <p className="text-gray-600 max-w-md">
            {statusFilter !== "all"
              ? `Não há empréstimos com status "${statusFilter}"`
              : "Nenhum empréstimo foi registrado ainda"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="text-sm text-muted-foreground">
          <strong>{count}</strong> empréstimo{count !== 1 ? "s" : ""} encontrado{count !== 1 ? "s" : ""}
        </div>
        <div className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </div>
      </div>

      <Separator />

      {/* Table */}
      <div className="px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Livro</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Data de Empréstimo</TableHead>
              <TableHead>Data de Devolução</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedLoans.map((loan) => (
              <TableRow key={loan.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-medium">{loan.book_title}</TableCell>
                <TableCell>{loan.user_name}</TableCell>
                <TableCell>{new Date(loan.borrowed_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  {loan.returned_at
                    ? new Date(loan.returned_at).toLocaleDateString("pt-BR")
                    : new Date(loan.due_date).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      loan.status === "pending"
                        ? "outline"
                        : loan.status === "active"
                          ? "default"
                          : loan.status === "returned"
                            ? "secondary"
                            : loan.status === "rejected"
                              ? "destructive"
                              : "destructive"
                    }
                  >
                    {loan.status === "pending"
                      ? "Pendente"
                      : loan.status === "active"
                        ? "Ativo"
                        : loan.status === "returned"
                          ? "Devolvido"
                          : loan.status === "rejected"
                            ? "Rejeitado"
                            : "Atrasado"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/admin/loans/${loan.id}`}>
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                      </Link>
                      <UpdateLoanForm loanId={loan.id} currentStatus={loan.status} currentDueDate={loan.due_date} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={count || 0}
          statusFilter={statusFilter}
        />
      )}
    </div>
  )
}
