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

// Skeleton components (unchanged)
function TableSkeleton() {
  return (
    <div className="hidden md:block rounded-lg border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Nome Completo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Série/Ano</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Data de Criação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index} className="animate-pulse">
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

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="overflow-hidden animate-pulse">
          <CardHeader className="pb-2 bg-muted/30">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-5 w-[100px]" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 pt-3">
            <div className="space-y-3">
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
        <Card className="border-red-200 bg-red-50 shadow-sm animate-in fade-in">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-red-700">Erro de Configuração</h3>
              <p className="text-red-600 max-w-md">
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

  let query = supabase
    .from('users')
    .select('id, full_name, email, role, created_at, class, grade', { count: 'exact' })
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>Resultados para:</span>
          <Badge variant="secondary" className="font-normal">
            {searchQuery}
          </Badge>
          <span>({count || 0} encontrados)</span>
        </div>
      )}

      <div className="hidden md:block rounded-lg border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead className="font-semibold">Nome Completo</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Turma</TableHead>
              <TableHead className="font-semibold">Série/Ano</TableHead>
              <TableHead className="font-semibold">Cargo</TableHead>
              <TableHead className="font-semibold">Data de Criação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students && students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.class || '-'}</TableCell>
                  <TableCell>{student.grade || '-'}</TableCell>
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
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 py-6 text-muted-foreground">
                    <User className="h-12 w-12 text-muted-foreground/50" />
                    <p>Nenhum aluno encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {students && students.length > 0 ? (
          students.map((student) => (
            <Card key={student.id} className="overflow-hidden border-primary/10 transition-all hover:shadow-md hover:border-primary/20">
              <CardHeader className="pb-2 bg-muted/30">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{student.full_name}</CardTitle>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {formatarRole(student.role)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-3">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground min-w-[60px]">Email:</span>
                    <span className="font-medium truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground min-w-[60px]">Turma:</span>
                    <span>{student.class || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground min-w-[60px]">Série:</span>
                    <span>{student.grade || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground min-w-[60px]">Criado em:</span>
                    <span>{new Date(student.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-center border-dashed">
            <div className="flex flex-col items-center justify-center space-y-2 py-6">
              <User className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum aluno encontrado.</p>
            </div>
          </Card>
        )}
      </div>

      {totalPages > 0 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm" aria-label="Navegação de páginas">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild
              className="hidden sm:flex"
            >
              <Link
                href={`/admin/users?page=${page - 1}&search=${encodeURIComponent(searchQuery)}`}
                className="transition-all"
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
                      className={`w-9 h-9 transition-all ${page === pageNum ? 'animate-pulse-light' : ''}`}
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
                className="transition-all"
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
  // Await searchParams to resolve it
  const params = await searchParams;
  const searchQuery = params.search || '';

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 top-0 z-10 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Alunos da Biblioteca</h1>
          </div>
          
          <form action="/admin/users" method="GET" className="w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome ou email..."
                name="search"
                defaultValue={searchQuery}
                className="pl-10 w-full sm:w-[300px] bg-background border-primary/20 focus-visible:ring-primary/30"
              />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 hover:bg-primary/10"
              >
                
                Buscar
              </Button>
            </div>
          </form>
        </div>

        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in">
            <span>Resultados para:</span>
            <Badge variant="secondary" className="font-normal">
              {searchQuery}
            </Badge>
          </div>
        )}
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