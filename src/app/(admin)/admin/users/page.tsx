import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Search } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";

// Interfaces
interface RawUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  class: string | null;
  grade: string | null;
  library_id: string;
}

interface FormattedUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  class: string;
  grade: string;
}

// Skeleton
function UsersListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome Completo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Série/Ano</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Tipagem ajustada pra Promise
interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  // Resolve a Promise dos searchParams
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number.parseInt((resolvedSearchParams.page as string) || "1", 10));
  const searchQuery = (resolvedSearchParams.search as string) || "";
  const roleFilter = (resolvedSearchParams.role as string) || "all";

  async function handleSearch(formData: FormData) {
    "use server";
    const search = formData.get("search") as string;
    const newParams = new URLSearchParams({ page: "1" });
    if (search) {
      newParams.set("search", search);
    }
    if (roleFilter && roleFilter !== "all") {
      newParams.set("role", roleFilter);
    }
    redirect(`/admin/users?${newParams.toString()}`);
  }

  async function handleRoleFilter(formData: FormData) {
    "use server";
    const role = formData.get("role") as string;
    const newParams = new URLSearchParams({ page: "1" });
    if (role && role !== "all") {
      newParams.set("role", role);
    }
    if (searchQuery) {
      newParams.set("search", searchQuery);
    }
    redirect(`/admin/users?${newParams.toString()}`);
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Alunos da Biblioteca</h1>
        <div className="flex items-center gap-4">
          <form action={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome ou email..."
                name="search"
                defaultValue={searchQuery}
                className="pl-10 w-[200px] sm:w-[300px] bg-background border-primary/20 focus-visible:ring-primary/30"
              />
            </div>
            <Button type="submit" variant="outline">Buscar</Button>
          </form>
          <form action={handleRoleFilter} className="flex items-center gap-2">
            <Select name="role" defaultValue={roleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="student">Estudante</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">Filtrar</Button>
          </form>
          
        </div>
      </div>
      <Suspense fallback={<UsersListSkeleton />}>
        <UsersTable page={page} searchQuery={searchQuery} roleFilter={roleFilter} />
      </Suspense>
    </div>
  );
}

async function UsersTable({ page, searchQuery, roleFilter }: { page: number; searchQuery: string; roleFilter: string }) {
  const supabase = await createClient();
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  // Verificar autenticação e permissões
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Erro na autenticação ou usuário não encontrado");
  }

  const roleFromMetadata = user.user_metadata?.role;
  let role = roleFromMetadata;

  if (!roleFromMetadata) {
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (userError || !userData?.role) {
      throw new Error("Erro ao buscar role ou role não encontrado");
    }
    role = userData.role;
  }

  if (role !== "admin") {
    throw new Error("Acesso negado: apenas administradores podem acessar esta página");
  }

  const { data: userLibrary, error: libraryError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();

  if (libraryError || !userLibrary?.library_id) {
    throw new Error("Biblioteca não associada ao administrador");
  }

  const libraryId = userLibrary.library_id;

  // Contagem
  let countQuery = supabase.from("users").select("*", { count: "exact", head: true }).eq("library_id", libraryId);
  if (searchQuery) {
    countQuery = countQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  }
  if (roleFilter !== "all") {
    countQuery = countQuery.eq("role", roleFilter);
  }
  const { count } = await countQuery;

  // Busca
  let usersQuery = supabase
    .from("users")
    .select("id, full_name, email, role, created_at, class, grade, library_id")
    .eq("library_id", libraryId);

  if (searchQuery) {
    usersQuery = usersQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  }
  if (roleFilter !== "all") {
    usersQuery = usersQuery.eq("role", roleFilter);
  }

  const { data: users, error } = await usersQuery
    .range(offset, offset + pageSize - 1)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Erro ao carregar usuários: " + error.message);
  }

  const formattedUsers: FormattedUser[] = (users || []).map((user: RawUser) => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    class: user.class || "-",
    grade: user.grade || "-",
  }));

  const totalPages = Math.ceil((count || 0) / pageSize);

  const formatarRole = (role: string) => {
    switch (role) {
      case "student":
        return "Estudante";
      case "admin":
        return "Administrador";
      default:
        return role;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome Completo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Série/Ano</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formattedUsers.length > 0 ? (
            formattedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.class}</TableCell>
                <TableCell>{user.grade}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "student" ? "default" : "secondary"}
                  >
                    {formatarRole(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString("pt-BR")}</TableCell>
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
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                Nenhum usuário registrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {totalPages > 0 && (
       // Paginação
       <div className="flex items-center justify-between px-2 p-6">
          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild disabled={page <= 1} className="h-9 px-4">
              <Link href={`/admin/users?page=${page > 1 ? page - 1 : 1}${searchQuery ? `&search=${searchQuery}` : ""}`}>
                Anterior
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild disabled={page >= totalPages} className="h-9 px-4">
              <Link href={`/admin/users?page=${page < totalPages ? page + 1 : totalPages}${searchQuery ? `&search=${searchQuery}` : ""}`}>
                Próxima
              </Link>
            </Button>
          </div>
        </div>
        
      )}
    </div>
  );
}