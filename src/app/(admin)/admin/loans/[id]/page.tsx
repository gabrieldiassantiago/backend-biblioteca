import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Book, Calendar, Clock, FileText, User, BookOpen, Mail, GraduationCap, School, Phone } from "lucide-react"
import Link from "next/link"
import { getUserLibraryId } from "../actions"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { UpdateLoanForm } from "@/components/loans/update-loan-form"

// Definir tipos para os dados retornados pelo Supabase
interface BookDetails {
  id: string
  title: string
  author?: string
  isbn?: string
}

interface UserDetails {
  id: string
  full_name: string
  email?: string
  phone?: string
  role: string
  class?: string
  grade?: string
}

interface LoanDetails {
  id: string
  user_id: string
  book_id: string
  borrowed_at: string
  due_date: string
  returned_at: string | null
  status: "pending" | "active" | "returned" | "overdue" | "rejected"
  return_observation: string | null
  books: BookDetails
  users: UserDetails
}

async function getLoanDetails(id: string) {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  const { data: loan, error } = await supabase
    .from("loans")
    .select(`
      id,
      user_id,
      book_id,
      borrowed_at,
      due_date,
      returned_at,
      status,
      return_observation,
      books:book_id (
        id,
        title,
        author,
        isbn
      ),
      users:user_id (
        id,
        full_name,
        email,
        phone,
        role,
        class,
        grade
      )
    `)
    .eq("id", id)
    .eq("library_id", libraryId)
    .single()

  if (error || !loan) {
    console.error("Erro ao buscar detalhes do empréstimo:", error)
    return null
  }

  return loan as unknown as LoanDetails
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return { label: "Pendente", variant: "outline" as const, color: "bg-gray-100 text-gray-800 border-gray-200" }
    case "active":
      return { label: "Ativo", variant: "default" as const, color: "bg-blue-100 text-blue-800 border-blue-200" }
    case "returned":
      return {
        label: "Devolvido",
        variant: "secondary" as const,
        color: "bg-green-100 text-green-800 border-green-200",
      }
    case "overdue":
      return { label: "Atrasado", variant: "destructive" as const, color: "bg-red-100 text-red-800 border-red-200" }
    case "rejected":
      return { label: "Rejeitado", variant: "destructive" as const, color: "bg-red-100 text-red-800 border-red-200" }
    default:
      return { label: status, variant: "outline" as const, color: "bg-gray-100 text-gray-800 border-gray-200" }
  }
}


interface Params {
  id: string;
}

interface LoanDetailsPageProps {
  params: Promise<Params>;
}

// Skeleton para detalhes do empréstimo
function LoanDetailsSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Skeleton className="h-6 w-64 mb-2" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full mb-4" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  )
}

// Wrapper para Suspense
export default function LoanDetailsPageWrapper(props: LoanDetailsPageProps) {
  return (
    <Suspense fallback={<LoanDetailsSkeleton />}>
      <LoanDetailsPageAsync {...props} />
    </Suspense>
  )
}

// Componente assíncrono real
async function LoanDetailsPageAsync({ params }: LoanDetailsPageProps) {
  const resolvedParams = await params; // Resolve the promise to get the actual params
  const loan = await getLoanDetails(resolvedParams.id)

  if (!loan) {
    notFound()
  }

  const { label: statusLabel, color: statusColor } = getStatusLabel(loan.status)
  const book = loan.books
  const user = loan.users

  // Formatar data em PT-BR
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/admin/loans" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista de empréstimos
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Coluna principal com detalhes do empréstimo */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-gray-800">Detalhes do Empréstimo</CardTitle>
                <Badge variant="outline" className={`font-medium px-3 py-1 ${statusColor}`}>
                  {statusLabel}
                </Badge>
              </div>
              <CardDescription className="text-gray-500">ID: {loan.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Informações do livro */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center text-gray-800">
                  <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
                  Livro
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                  <h4 className="font-semibold text-lg text-gray-900">{book.title}</h4>
                  {book.author && (
                    <p className="text-gray-600 flex items-center mt-2">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      Autor: {book.author}
                    </p>
                  )}
                  {book.isbn && (
                    <p className="text-gray-600 flex items-center mt-2">
                      <Book className="h-4 w-4 mr-2 text-gray-400" />
                      ISBN: {book.isbn}
                    </p>
                  )}
                </div>
              </div>

              {/* Datas do empréstimo */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center text-gray-800">
                  <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                  Datas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-amber-200 transition-colors">
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                      Data de Empréstimo
                    </p>
                    <p className="font-medium text-gray-800 mt-1">{formatDate(loan.borrowed_at)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      Data de Devolução Prevista
                    </p>
                    <p className="font-medium text-gray-800 mt-1">{formatDate(loan.due_date)}</p>
                  </div>
                  {loan.returned_at && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-green-200 transition-colors">
                      <p className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-green-500" />
                        Data de Devolução Real
                      </p>
                      <p className="font-medium text-gray-800 mt-1">{formatDate(loan.returned_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações (se houver) */}
              {loan.return_observation && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium flex items-center text-gray-800">
                    <FileText className="mr-2 h-5 w-5 text-blue-600" />
                    Observação da Devolução
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <p className="text-gray-700 whitespace-pre-wrap">{loan.return_observation}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral com informações do usuário */}
        <div>
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 border-b border-gray-100">
              <CardTitle className="text-lg font-medium flex items-center text-gray-800">
                <User className="mr-2 h-5 w-5 text-green-600" />
                Informações do Aluno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div>
                <h4 className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  Nome
                </h4>
                <p className="font-semibold text-gray-800 mt-1">{user.full_name}</p>
              </div>
              {user.email && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    Email
                  </h4>
                  <p className="text-gray-700 mt-1">{user.email}</p>
                </div>
              )}
              {user.phone && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    Telefone do responsável 
                  </h4>
                  <p className="text-gray-700 mt-1">{user.phone}</p>
                </div>
              )}
              {user.class && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 flex items-center">
                    <School className="h-4 w-4 mr-2 text-gray-400" />
                    Turma
                  </h4>
                  <p className="text-gray-700 mt-1">{user.class}</p>
                </div>
              )}
              {user.grade && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                    Série
                  </h4>
                  <p className="text-gray-700 mt-1">{user.grade}</p>
                </div>
              )}
            </CardContent>
            <Separator />
            <CardFooter className="pt-4 p-5">
              <Link href={`/admin/users/${user.id}`} className="w-full">
                <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 hover:text-gray-900">
                  Ver perfil completo
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Status do empréstimo */}
          <Card className="mt-6 border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-gray-100">
              <CardTitle className="text-lg font-medium flex items-center text-gray-800">
                <Clock className="mr-2 h-5 w-5 text-blue-600" />
                Status do Empréstimo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center py-4">
                <Badge variant="outline" className={`text-lg px-4 py-2 font-medium ${statusColor}`}>
                  {statusLabel}
                </Badge>
                <p className="text-sm text-gray-500 mt-3">
                  {loan.status === "active" && "Empréstimo em andamento"}
                  {loan.status === "pending" && "Aguardando aprovação"}
                  {loan.status === "returned" && "Livro devolvido"}
                  {loan.status === "overdue" && "Devolução atrasada"}
                  {loan.status === "rejected" && "Empréstimo rejeitado"}
                </p>
              </div>
              <div className="mt-4">
                <UpdateLoanForm
                  loanId={loan.id}
                  currentStatus={loan.status}
                  currentDueDate={loan.due_date}
                />
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-4 p-5">
              <Link href="/admin/loans" className="w-full">
                <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 hover:text-gray-900">
                  Voltar para lista
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

