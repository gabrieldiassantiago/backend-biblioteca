import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, User, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import UserEditForm from './user-edit-form';
import { Separator } from '@/components/ui/separator';
import { RecentLoans } from './recente-loans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Interface for raw loan data from Supabase
interface RawLoan {
  id: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  status: string;
  book: { id: string; title: string; author: string } | null;
  users: { full_name: string } | null;
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params to resolve the id
  const { id } = await params;

  // Função interna assíncrona para lidar com a lógica
  async function getUserData() {
    const supabase = await createClient();
    
    // Check authentication and admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/login');
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, library_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.role || userData.role !== 'admin') {
      redirect('/dashboard');
    }

    const libraryId = userData.library_id;
    if (!libraryId) {
      return {
        error: true,
        errorType: 'library',
        student: null,
        loans: []
      };
    }

    // Fetch the student data
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('library_id', libraryId)
      .single();

    if (studentError || !student) {
      return {
        error: true,
        errorType: 'student',
        student: null,
        loans: []
      };
    }

    // Fetch recent loans for this student
    const { data, error: loansError } = await supabase
      .from('loans')
      .select(`
        id,
        borrowed_at,
        due_date,
        returned_at,
        status,
        book:book_id(id, title, author),
        users:user_id(full_name)
      `)
      .eq('user_id', id)
      .eq('library_id', libraryId)
      .order('borrowed_at', { ascending: false })
      .limit(5);

    if (loansError) {
      console.error('Erro ao buscar empréstimos:', loansError);
      return {
        error: false,
        errorType: null,
        student,
        loans: []
      };
    }

    // Map the raw loan data to the Loan interface
    const loans = (data as unknown as RawLoan[]).map((loan) => {
      // Validate the status field
      const validStatuses = ['active', 'returned', 'overdue', 'lost'] as const;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = validStatuses.includes(loan.status as any)
        ? loan.status as 'active' | 'returned' | 'overdue' | 'lost'
        : 'active'; // Fallback to 'active' if status is invalid

      return {
        id: loan.id,
        book: loan.book || { id: '', title: 'Livro desconhecido', author: 'Autor desconhecido' },
        borrowed_at: loan.borrowed_at,
        due_date: loan.due_date,
        returned_at: loan.returned_at,
        status,
      };
    });

    return {
      error: false,
      errorType: null,
      student,
      loans
    };
  }

  // Renderização
  const { error, errorType, student, loans } = await getUserData();

  if (error) {
    if (errorType === 'library') {
      return (
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50 shadow-sm">
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
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
          <Link href="/admin/users">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {student.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as informações do aluno
          </p>
        </div>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Empréstimos</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <UserEditForm student={student} />
        </TabsContent>
        
        
        <TabsContent value="loans" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Empréstimos Recentes
              </CardTitle>
              <CardDescription>
                Últimos livros emprestados por {student.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentLoans loans={loans} userId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}