import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BookOpen, Lock, Mail } from 'lucide-react';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;

  async function handleLogin(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      redirect('/admin/auth/login?error=' + encodeURIComponent(authError.message));
    }
    
    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
        
      if (userData?.role === 'admin') {
        redirect('/admin/');
      } else {
        await supabase.auth.signOut();
        redirect('/admin/auth/login?error=' + encodeURIComponent('Acesso negado: apenas administradores podem fazer login.'));
      }
    }
    
    redirect('/admin/auth/login?error=' + encodeURIComponent('Erro desconhecido ao verificar usuário.'));
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Section - Illustration */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/90 to-primary/70 justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_bottom,transparent,white)]"></div>
        <div className="relative z-10 text-center px-8 max-w-md">
          <BookOpen className="mx-auto h-20 w-20 text-white mb-6 opacity-90" strokeWidth={1.5} />
          <h1 className="text-3xl font-bold text-white mb-3">
            Bem-vindo de Volta
          </h1>
          <p className="text-white/80 text-lg">
            Gerencie sua biblioteca digital com facilidade e segurança
          </p>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <BookOpen className="h-12 w-12 mx-auto text-primary lg:hidden" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold text-foreground">Login do adminstrador</h2>
            <p className="text-muted-foreground text-sm">
              Insira suas credenciais para acessar o painel de administração, vale lembrar que apenas administradores podem acessar.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form action={handleLogin} className="space-y-5">
            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full font-medium"
            >
              Entrar
            </Button>

            {/* Links */}
            <div className="flex justify-between text-sm">
              <Link 
                href="/forgot-password" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueceu a senha?
              </Link>
              <Link 
                href="/register" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Criar conta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}