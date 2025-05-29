import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Eye, Users, GraduationCap, UserCheck, Clock } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { UsersSearch } from "../../../../components/users/admin/users-search"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getUserLibraryId } from "../loans/actions"
import { UsersPagination } from "../../../../components/users/admin/users-pagination"
import { UsersFilters } from "../../../../components/users/admin/users-filters"

// Interfaces
interface RawUser {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  class: string | null
  grade: string | null
  library_id: string
  phone: string | null
}

interface FormattedUser {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  class: string
  grade: string
  phone: string
}

// Skeleton Components
function UsersListSkeleton() {
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
              <TableHead>Nome Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Série/Ano</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Data de Cadastro</TableHead>
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
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
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
async function UsersStats() {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  const { data: users } = await supabase.from("users").select("role, grade, created_at").eq("library_id", libraryId)

  if (!users) return null

  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === "student").length,
    admins: users.filter((u) => u.role === "admin").length,
    recentlyAdded: users.filter((u) => {
      const createdAt = new Date(u.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return createdAt > thirtyDaysAgo
    }).length,
  }

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats.total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      description: "cadastrados",
    },
    {
      title: "Estudantes",
      value: stats.students,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      description: "alunos ativos",
    },
    {
      title: "Administradores",
      value: stats.admins,
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      description: "gestores",
    },
    {
      title: "Novos (30 dias)",
      value: stats.recentlyAdded,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      description: "recém cadastrados",
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

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number.parseInt((resolvedSearchParams.page as string) || "1", 10))
  const search = (resolvedSearchParams.search as string) || ""
  const grade = (resolvedSearchParams.grade as string) || ""
  const sort = (resolvedSearchParams.sort as string) || "newest"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">Usuários</h1>
                  <p className="text-lg text-muted-foreground">Gerencie alunos e usuários da biblioteca</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <Suspense fallback={<StatsSkeletonLoader />}>
            <UsersStats />
          </Suspense>
        </div>

            {/* Search and Filters Section */}
      <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* Search Bar */}
            <div className="flex-grow min-w-[280px] max-w-lg">
              <UsersSearch defaultValue={search} />
            </div>

            {/* Filters */}
            <div className="flex-grow min-w-[280px] max-w-2xl">
              <UsersFilters currentGrade={grade} currentSort={sort} />
            </div>
          </div>
        </CardContent>
      </Card>


        {/* Results Section */}
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {search && (
                <span className="flex items-center gap-1">
                  Resultados para <strong className="text-foreground">{search}</strong>
                </span>
              )}
              {(grade || (sort && sort !== "newest")) && (
                <span className="flex items-center gap-1">• Filtros aplicados</span>
              )}
            </div>
          </div>

          {/* Users Table */}
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <Suspense fallback={<UsersListSkeleton />}>
              <UsersTable page={page} search={search} grade={grade} sort={sort} />
            </Suspense>
          </Card>
        </div>
      </div>
    </div>
  )
}

async function UsersTable({ page, search, grade, sort }: { page: number; search: string; grade: string; sort: string }) {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()
  const pageSize = 12
  const offset = (page - 1) * pageSize

  // Contagem
  let countQuery = supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("library_id", libraryId)
    .eq("role", "student")

  if (search) {
    countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (grade) {
    countQuery = countQuery.eq("grade", grade)
  }

  const { count } = await countQuery

  // Busca
  let usersQuery = supabase
    .from("users")
    .select("id, full_name, email, role, created_at, class, grade, library_id, phone")
    .eq("library_id", libraryId)
    .eq("role", "student")

  if (search) {
    usersQuery = usersQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (grade) {
    usersQuery = usersQuery.eq("grade", grade)
  }

  // Sorting
  switch (sort) {
    case "oldest":
      usersQuery = usersQuery.order("created_at", { ascending: true })
      break
    case "name-asc":
      usersQuery = usersQuery.order("full_name", { ascending: true })
      break
    case "name-desc":
      usersQuery = usersQuery.order("full_name", { ascending: false })
      break
    case "email-asc":
      usersQuery = usersQuery.order("email", { ascending: true })
      break
    case "email-desc":
      usersQuery = usersQuery.order("email", { ascending: false })
      break
    default: // newest
      usersQuery = usersQuery.order("created_at", { ascending: false })
  }

  const { data: users, error } = await usersQuery.range(offset, offset + pageSize - 1)

  if (error) {
    console.error("Erro ao buscar usuários:", error.message)
    throw new Error("Erro ao carregar usuários: " + error.message)
  }

  const formattedUsers: FormattedUser[] = (users || []).map((user: RawUser) => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    class: user.class || "-",
    grade: user.grade || "-",
    phone: user.phone || "-",
  }))

  const totalPages = Math.ceil((count || 0) / pageSize)

  if (!formattedUsers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Users className="w-12 h-12 text-gray-400" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Nenhum usuário encontrado</h3>
          <p className="text-gray-600 max-w-md">
            {search
              ? `Não encontramos nenhum usuário que corresponda à sua busca por "${search}"`
              : "Nenhum usuário foi cadastrado ainda"}
          </p>
          {search && (
            <Link href="/admin/users">
              <Button variant="outline" className="mt-4">
                Limpar busca
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="text-sm text-muted-foreground">
          {search ? (
            <span>
              <strong>{count}</strong> resultado{count !== 1 ? "s" : ""} para {search}
            </span>
          ) : (
            <span>
              <strong>{count}</strong> usuário{count !== 1 ? "s" : ""} cadastrado{count !== 1 ? "s" : ""}
            </span>
          )}
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
              <TableHead>Nome Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Série/Ano</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  {user.class !== "-" ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {user.class}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.grade !== "-" ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {user.grade}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/admin/users/${user.id}`}>
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                      </Link>
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
        <UsersPagination currentPage={page} totalPages={totalPages} search={search} grade={grade} sort={sort} />
      )}
    </div>
  )
}
