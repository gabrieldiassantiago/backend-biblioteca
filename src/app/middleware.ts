// middleware.ts (na raiz do projeto)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Ajuste o caminho conforme sua estrutura

export async function middleware(request: NextRequest) {
  const supabase = await createClient();

  // Verifica o usuário autenticado
  const { data: { user }, error } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // Se for uma rota admin e o usuário não estiver autenticado, redireciona para login
  if (isAdminRoute && (error || !user)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se o usuário estiver autenticado, verifica o role
  if (isAdminRoute && user) {
    const role = user.user_metadata?.role || (
      await supabase.from('users').select('role').eq('id', user.id).single()
    ).data?.role || '';

    if (role !== 'admin') {
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