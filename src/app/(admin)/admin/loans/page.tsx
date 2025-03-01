"use server"

import { createClient } from "@/lib/supabase/server"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { UpdateLoanForm } from "./update-loan-form"

// Função para obter o library_id do usuário autenticado
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

  if (userError || !userData?.library_id) {
    throw new Error("Usuário não está vinculado a uma biblioteca")
  }

  return userData.library_id
}

// Interface para o livro aninhado
interface Book {
  title: string
}

// Interface para o usuário aninhado
interface User {
  full_name: string
}

// Interface para o empréstimo com joins (tipo bruto do Supabase)
interface RawLoan {
  id: string
  user_id: string
  book_id: string
  library_id: string
  borrowed_at: string
  due_date: string
  returned_at: string | null
  status: "active" | "returned" | "overdue"
  books: Book
  users: User
}

// Interface para o empréstimo formatado
interface Loan {
  id: string
  user_id: string
  book_id: string
  library_id: string
  borrowed_at: string
  due_date: string
  returned_at: string | null
  status: "active" | "returned" | "overdue"
  book_title: string
  user_name: string
}

// Componente Skeleton para a tabela de empréstimos
function LoanListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Livro</TableHead>
            <TableHead>Usuário</TableHead>
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

// Componente principal da página de empréstimos
export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  const paramsObj = await searchParams
  const page = Number.parseInt(paramsObj.page || "1", 10)
  const pageSize = 10
  const offset = (page - 1) * pageSize

  const { count } = await supabase.from("loans").select("*", { count: "exact", head: true }).eq("library_id", libraryId)

  const { data: loans, error } = await supabase
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
      books (title),
      users (full_name)
    `)
    .eq("library_id", libraryId)
    .range(offset, offset + pageSize - 1)
    .order("borrowed_at", { ascending: false })
    .returns<RawLoan[]>()

  if (error) {
    console.error("Erro ao buscar empréstimos:", error.message)
    throw new Error("Erro ao carregar histórico de empréstimos")
  }

  const formattedLoans: Loan[] = (loans || []).map((loan) => {
    return {
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
    }
  })

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Histórico de Empréstimos</h1>
      <Suspense fallback={<LoanListSkeleton />}>
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
                          loan.status === "active"
                            ? "default"
                            : loan.status === "returned"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {loan.status === "active" ? "Ativo" : loan.status === "returned" ? "Devolvido" : "Atrasado"}
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
                          <UpdateLoanForm loanId={loan.id} currentDueDate={loan.due_date} />
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

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
              <div className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </div>
  )
}

