// src/app/(auth)/login/page.tsx
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>; // Corrigido para Promise
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams; // Resolve a Promise
  const error = params.error;

  async function handleLogin(formData: FormData) {
    'use server';
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirect('/admin/auth/login?error=' + encodeURIComponent(error.message));
    }

    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = userData?.role || data.user.role || '';

      if (role === 'admin') {
        redirect('/admin/');
      } else {
        await supabase.auth.signOut();
        redirect('/admin/auth/login?error=' + encodeURIComponent('Acesso negado: apenas administradores podem fazer login.'));
      }
    }

    redirect('/admin/auth/login?error=' + encodeURIComponent('Erro desconhecido ao verificar usuário.'));
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:flex w-full md:w-1/2 bg-black text-white flex-col justify-center items-center p-8">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo de Volta, Admin</h1>
        <p className="text-lg text-center max-w-md">
          Faça login para gerenciar a biblioteca e seus livros.
        </p>
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Login do Administrador</h2>
            <p className="text-sm text-muted-foreground">Insira suas credenciais abaixo</p>
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>} {/* Exibe o erro */}
          <form action={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
            <p className="text-sm text-center text-muted-foreground">
              Não tem conta?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Registre-se
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}