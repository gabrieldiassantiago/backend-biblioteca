import { Inter } from 'next/font/google';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, Book, BookOpen, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

const inter = Inter({ subsets: ['latin'] });

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inicializa o cliente Supabase usando a função do server.ts
  const supabase = await createClient();

  // Verifica o usuário autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('Erro na autenticação ou usuário não encontrado:', authError?.message || 'Sessão ausente');
    redirect('/login');
  }

  // Busca o role do usuário (prioriza user_metadata, depois a tabela users)
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
      redirect('/login');
    }
    role = userData.role;
  }

  // Verifica se o usuário é admin
  if (role !== 'admin') {
    console.log('Acesso negado - Role do usuário:', role);
    redirect('/login');
  }

  // Função de logout (Server Action)
  async function handleLogout() {
    'use server';
    const supabase = await createClient(); // Reutiliza a mesma função
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className={`${inter.className} antialiased bg-gray-50 flex min-h-screen flex-col md:flex-row`}>
      {/* Menu Lateral (Desktop) */}
      <aside className="hidden md:flex md:w-64 bg-white p-4 flex-col border-r border-gray-200 shadow-md">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
            Biblioteca Digital
          </Link>
        </div>
        <nav className="space-y-2">
          <Link
            href="/admin/dashboard"
            className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/admin/books"
            className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            <Book className="mr-3 h-5 w-5" />
            Gerenciar Livros
          </Link>
          <Link
            href="/admin/loans"
            className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            <BookOpen className="mr-3 h-5 w-5" />
            Gerenciar Empréstimos
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            <Settings className="mr-3 h-5 w-5" />
            Configurações
          </Link>
        </nav>
      </aside>

      {/* Menu Mobile (Hamburguer) */}
      <header className="md:hidden flex items-center p-4 bg-gray-900 text-white shadow-md">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-white p-4 shadow-md">
            <div className="mb-6">
              <Link href="/admin/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
                Biblioteca Digital
              </Link>
            </div>
            <nav className="space-y-2">
              <Link
                href="/admin"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/admin/books"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <Book className="mr-3 h-5 w-5" />
                Gerenciar Livros
              </Link>
              <Link
                href="/admin/loans"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <BookOpen className="mr-3 h-5 w-5" />
                Gerenciar Empréstimos
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <Settings className="mr-3 h-5 w-5" />
                Configurações
              </Link>
              <form action={handleLogout} className="mt-4">
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full text-gray-700 hover:bg-gray-100"
                >
                  Sair
                </Button>
              </form>
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="text-lg font-bold ml-2 text-white">
          Biblioteca Digital
        </Link>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-6 bg-gray-50">{children}</main>
    </div>
  );
}