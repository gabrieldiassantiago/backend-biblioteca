import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  console.log('Middleware executado para:', request.nextUrl.pathname);
  const supabase = await createClient();

  // Verifica o usuário autenticado
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Usuário:', user, 'Erro:', error);

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isPublicRoute = ['/login', '/register'].includes(request.nextUrl.pathname);

  // Se for uma rota admin e o usuário não estiver autenticado, redireciona para login
  if (isAdminRoute && (error || !user)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se o usuário estiver autenticado
  if (user) {
    // Obtém o papel do usuário (de user_metadata ou do banco, se necessário)
    const role = user.user_metadata?.role || (
      await supabase.from('users').select('role').eq('id', user.id).single()
    ).data?.role || '';

    // Se for uma rota pública (login/register) e o usuário for admin, redireciona para /admin
    if (isPublicRoute && role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Se for uma rota admin e o usuário não for admin, nega acesso
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(
        new URL('/admin/auth/login?error=' + encodeURIComponent('Acesso negado. Somente administradores podem acessar.'), request.url)
      );
    }
  }

  // Se tudo estiver ok, prossegue com a requisição
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|admin/auth/login).*)'],
};