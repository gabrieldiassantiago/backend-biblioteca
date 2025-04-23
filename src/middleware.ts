import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  console.log('Middleware executado para:', request.nextUrl.pathname);
  const supabase = await createClient();

  // Verificar autenticação do usuário
  const { data: { session } } = await supabase.auth.getSession();
  
  // Verificar se o usuário está autenticado
  const user = session?.user || null;
  
  console.log('Status autenticação:', user ? 'Autenticado' : 'Não autenticado');
  
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isPublicRoute = ['/login', '/register'].includes(pathname);

  // Se for uma rota admin e o usuário não estiver autenticado, redireciona para login
  if (isAdminRoute && !user) {
    console.log('Redirecionando para /login: usuário não autenticado tentando acessar área admin');
    
    // Incluir parâmetro de consulta para indicar que o redirecionamento foi devido a falta de autenticação
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirected', 'unauthorized');
    
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário estiver autenticado
  if (user) {
    // Obtém o papel do usuário
    const role = user.user_metadata?.role || '';
    
    if (!role) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (userError) throw userError;
        
        const dbRole = userData?.role || '';
        
        if (isPublicRoute && dbRole === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }

        if (isAdminRoute && dbRole !== 'admin') {
          return NextResponse.redirect(
            new URL('/login?error=' + encodeURIComponent('Acesso negado. Somente administradores podem acessar.'), request.url)
          );
        }
      } catch (err) {
        console.error('Erro ao buscar papel do usuário:', err);
        if (isAdminRoute) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
      }
    } else {
      if (isPublicRoute && role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      if (isAdminRoute && role !== 'admin') {
        return NextResponse.redirect(
          new URL('/login?error=' + encodeURIComponent('Acesso negado. Somente administradores podem acessar.'), request.url)
        );
      }
    }
  }

  return NextResponse.next();
}

// Atualize o matcher para capturar todas as rotas admin sem exceção
export const config = {
  matcher: [
    '/login',
    '/register',
    '/admin/:path*',  // Captura qualquer coisa em /admin, incluindo subpastas
  ],
};