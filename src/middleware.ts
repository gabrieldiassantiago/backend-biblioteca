import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  console.log('Middleware executado para:', request.nextUrl.pathname);
  const supabase = await createClient();

  // Verificar cookie de autenticação
  const authToken = request.cookies.get('supabase-auth-token')?.value;
  let user = null;
  let error = null;

  if (authToken) {
    try {
      const { data, error: authError } = await supabase.auth.getUser(authToken);
      if (!authError && data.user) {
        user = data.user;
        console.log('[Middleware Cache] Usuário obtido do cookie:', user.id);
      } else {
        error = authError;
      }
    } catch (err) {
      console.error('[Middleware Cache] Erro ao validar token:', err);
      error = err;
    }
  }

  // Se não houver usuário no cache, autenticar
  if (!user && !error) {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    user = authUser;
    error = authError;
    console.log('Usuário autenticado via Supabase:', user?.id, 'Erro:', error);
  }

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isPublicRoute = ['/login', '/register'].includes(pathname);

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

  // Prossegue com a requisição se tudo estiver ok
  return NextResponse.next();
}

// Configuração do matcher para rodar apenas nas rotas desejadas, excluindo assets
export const config = {
  matcher: [
    '/login',
    '/admin/((?!api|_next/static|_next/image|favicon.ico).*)', // Exclui APIs, assets estáticos e favicon
  ],
};