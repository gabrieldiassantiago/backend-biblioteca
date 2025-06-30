import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next') || // Arqu Middlewares
    pathname.includes('/favicon.ico') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.jpeg') ||
    pathname.includes('.svg') ||
    pathname.includes('.css') ||
    pathname.includes('.js')
  ) {
    return NextResponse.next();
  }

  console.log('Middleware executado para:', pathname);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const isAdminRoute = pathname.startsWith('/admin');
  const isPublicRoute = ['/login', '/register'].includes(pathname);

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAdminRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirected', 'unauthorized');
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const role = user.user_metadata?.role || 'user';
    if (isPublicRoute && role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Acesso negado. Somente administradores podem acessar.'), request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/admin/:path*',
    '/'
  ],
};