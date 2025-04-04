"use server"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal } from "lucide-react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UpdateLoanForm } from "@/components/loans/update-loan-form"
import { NewLoanModal } from "./new-loan-form"
import { redirect } from "next/navigation"
import { PaginationControls } from "./PaginationControls"

// Função para obter o library_id do admin autenticado
async function getUserLibraryId() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData?.library_id) throw new Error("Usuário não vinculado a uma biblioteca")
  return userData.library_id
}

interface Book {
  title: string
}
interface User {
  full_name: string
}
interface RawLoan {
  id: string
  user_id: string
  book_id: string
  library_id: string
  borrowed_at: string
  due_date: string
  returned_at: string | null
  status: "pending" | "active" | "returned" | "overdue" | "rejected"
  books: Book
  users: User
}
interface Loan {
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

// Componente de Skeleton
function LoanListSkeleton() {
  return (
    <div className="rounded-md border">
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
    </div>
  )
}

export default async function LoansPage({
  searchParams,
}: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const paramsObj = await searchParams
  const page = Math.max(1, Number.parseInt(paramsObj.page || "1", 10))
  const statusFilter = paramsObj.status || "all"

  async function handleStatusFilter(formData: FormData) {
    "use server"
    const status = formData.get("status") as string
    const newParams = new URLSearchParams({ page: "1" })
    if (status && status !== "all") {
      newParams.set("status", status)
    }
    console.log("Redirecionando com novos parâmetros:", newParams.toString())
    redirect(`/admin/loans?${newParams.toString()}`)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Histórico de Empréstimos</h1>
        <div className="flex items-center gap-4">
          <form action={handleStatusFilter} className="flex items-center gap-2">
            <Select name="status" defaultValue={statusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="returned">Devolvido</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
          </form>
          <NewLoanModal />
        </div>
      </div>
      <Suspense fallback={<LoanListSkeleton />}>
        <LoansTable page={page} statusFilter={statusFilter} />
      </Suspense>
    </div>
  )
}

// Novo componente para carregar e exibir os empréstimos
async function LoansTable({ page, statusFilter }: { page: number; statusFilter: string }) {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()
  const pageSize = 10
  const offset = (page - 1) * pageSize

  console.log("Parâmetros recebidos:", { page, statusFilter })

  // Contagem de empréstimos com filtro de status
  let countQuery = supabase.from("loans").select("*", { count: "exact", head: true }).eq("library_id", libraryId)

  if (statusFilter !== "all") {
    countQuery = countQuery.eq("status", statusFilter)
  }

  const { count } = await countQuery
  console.log("Total de empréstimos encontrados:", count)

  // Busca de empréstimos com filtro de status
  let loansQuery = supabase
    .from("loans")
    .select(
      "id, user_id, book_id, library_id, borrowed_at, due_date, returned_at, status, books (title), users (full_name)",
    )
    .eq("library_id", libraryId)

  if (statusFilter !== "all") {
    loansQuery = loansQuery.eq("status", statusFilter)
  }

  const { data: loans, error } = await loansQuery
    .range(offset, offset + pageSize - 1)
    .order("borrowed_at", { ascending: false })
    .returns<RawLoan[]>()

  if (error) {
    console.error("Erro ao buscar empréstimos:", error.message)
    throw new Error("Erro ao carregar histórico de empréstimos: " + error.message)
  }

  console.log("Empréstimos retornados:", loans?.length)

  const formattedLoans: Loan[] = (loans || []).map((loan) => ({
    id: loan.id,
    user_id: loan.user_id,
    book_id: loan.book_id,
    library_id: loan.library_id,
    borrowed_at: loan.borrowed_at,
    due_date: loan.due_date,
    returned_at: loan.returned_at,
    status: loan.status,
    book_title: loan.books.title || "Título não encontrado",
    user_name: loan.users.full_name || "Usuário não encontrado",
  }))

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="rounded-md border">
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
          {formattedLoans.length > 0 ? (
            formattedLoans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell className="font-medium">{loan.book_title}</TableCell>
                <TableCell>{loan.user_name}</TableCell>
                <TableCell>{new Date(loan.borrowed_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {loan.returned_at
                    ? new Date(loan.returned_at).toLocaleDateString()
                    : new Date(loan.due_date).toLocaleDateString()}
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
                      <UpdateLoanForm loanId={loan.id} currentStatus={loan.status} currentDueDate={loan.due_date} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                Nenhum empréstimo registrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
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

