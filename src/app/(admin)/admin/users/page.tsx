import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, User, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

// Componente de Skeleton para a tabela
function TableSkeleton() {
  return (
    <div className="hidden md:block rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome Completo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Turma</TableHead> {/* Nova coluna */}
            <TableHead>Série/Ano</TableHead> {/* Nova coluna */}
            <TableHead>Cargo</TableHead>
            <TableHead>Data de Criação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell> 
              <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell> 
              <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Componente de Skeleton para os cards 
function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-5 w-[100px]" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" /> 
                <Skeleton className="h-4 w-1/2" /> 
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente de Skeleton para a paginação
function PaginationSkeleton() {
  return (
    <div className="flex justify-center mt-6">
      <div className="flex items-center space-x-1">
        <Skeleton className="h-9 w-20 hidden sm:block" />
        <div className="flex space-x-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-9 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-9 w-20 hidden sm:block" />
      </div>
    </div>
  );
}

async function StudentsContent({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const supabase = await createClient();

  const formatarRole = (role: string) => {
    switch (role) {
      case 'student':
        return 'Estudante';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('Erro na autenticação ou usuário não encontrado:', authError?.message || 'Sessão ausente');
    return null;
  }

  const roleFromMetadata = user.user_metadata?.role;
  let role = roleFromMetadata;

  if (!roleFromMetadata) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.role) {
      console.log('Erro ao buscar role ou role não encontrado:', userError?.message || 'Dados ausentes');
      return null;
    }
    role = userData.role;
  }

  if (role !== 'admin') {
    console.log('Acesso negado - Role do usuário:', role);
    return null;
  }

  const { data: userLibrary, error: libraryError } = await supabase
    .from('users')
    .select('library_id')
    .eq('id', user.id)
    .single();

  if (libraryError || !userLibrary?.library_id) {
    console.log('Erro ao buscar library_id:', libraryError?.message || 'Dados ausentes');
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <h3 className="text-xl font-semibold text-red-700">Erro de Configuração</h3>
              <p className="text-red-600">
                Biblioteca não associada ao administrador. Contate o suporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const libraryId = userLibrary.library_id;

  const params = await searchParams;
  const searchQuery = params.search || '';
  const page = parseInt(params.page || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;

//aqui é a consulta dos dados que precisamos e vao ser  exibidos na tabela
   let query = supabase
    .from('users')
    .select('id, full_name, email, role, created_at, class, grade', { count: 'exact' }) // Adicionados class e grade
    .eq('library_id', libraryId)
    .eq('role', 'student');

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  }

  const { data: students, error: studentsError, count } = await query.range(offset, offset + limit - 1);

  if (studentsError) {
    console.error('Erro ao listar alunos:', studentsError.message);
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <h3 className="text-xl font-semibold text-red-700">Erro ao Carregar Dados</h3>
              <p className="text-red-600">
                {studentsError.message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return (
    <>
      {searchQuery && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Resultados para:</span>
          <Badge variant="secondary" className="font-normal">
            {searchQuery}
          </Badge>
          <span>({count || 0} encontrados)</span>
        </div>
      )}

      {/* para pc*/}
      <div className="hidden md:block rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Turma</TableHead> {/* Nova coluna */}
              <TableHead>Série/Ano</TableHead> {/* Nova coluna */}
              <TableHead>Cargo</TableHead>
              <TableHead>Data de Criação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students && students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.class || '-'}</TableCell> {/* Exibe Turma */}
                  <TableCell>{student.grade || '-'}</TableCell> {/* Exibe Série */}
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {formatarRole(student.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(student.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center"> {/* Ajustado para 6 colunas */}
                  Nenhum aluno encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {students && students.length > 0 ? (
          students.map((student) => (
            <Card key={student.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{student.full_name}</CardTitle>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {formatarRole(student.role)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Turma:</span>
                    <span>{student.class || '-'}</span> {/* Exibe Turma */}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Série:</span>
                    <span>{student.grade || '-'}</span> {/* Exibe Série */}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span>{new Date(student.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-2 py-6">
              <User className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum aluno encontrado.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 0 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1" aria-label="Navegação de páginas">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild
              className="hidden sm:flex"
            >
              <Link
                href={`/admin/users?page=${page - 1}&search=${encodeURIComponent(searchQuery)}`}
              >
                Anterior
              </Link>
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                const showPage = 
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= page - 1 && pageNum <= page + 1);
                
                const showEllipsisBefore = i === 1 && page > 3;
                const showEllipsisAfter = i === totalPages - 2 && page < totalPages - 2;
                
                if (showEllipsisBefore) {
                  return (
                    <span key="ellipsis-before" className="px-3 py-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  );
                }
                
                if (showEllipsisAfter) {
                  return (
                    <span key="ellipsis-after" className="px-3 py-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  );
                }
                
                if (showPage) {
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="icon"
                      className="w-9 h-9"
                      asChild
                    >
                      <Link
                        href={`/admin/users?page=${pageNum}&search=${encodeURIComponent(searchQuery)}`}
                        aria-current={page === pageNum ? "page" : undefined}
                      >
                        {pageNum}
                      </Link>
                    </Button>
                  );
                }
                
                return null;
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              asChild
              className="hidden sm:flex"
            >
              <Link
                href={`/admin/users?page=${page + 1}&search=${encodeURIComponent(searchQuery)}`}
              >
                Próxima
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Alunos da Biblioteca</h1>
        </div>
        
        <form action="/admin/users" method="GET" className="w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome ou email..."
              name="search"
              defaultValue={searchParams instanceof Promise ? '' : searchParams}
              className="pl-10 w-full md:w-[300px] bg-background"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7"
            >
              Buscar
            </Button>
          </div>
        </form>
      </div>

      <Suspense fallback={
        <>
          <TableSkeleton />
          <CardSkeleton />
          <PaginationSkeleton />
        </>
      }>
        <StudentsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}