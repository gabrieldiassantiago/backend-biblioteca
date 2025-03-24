import { redirect } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Mail, Lock } from 'lucide-react';
import Image from 'next/image';
import { SubmitButton } from './SubmitButton';
import { ErrorAlert } from './Alert';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;

  async function handleLogin(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      redirect('/login?error=Email ou senha inválidos');
    }

    if (data.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        redirect('/login?error=Erro ao verificar permissões');
      }

      if (userData.role === 'admin') {
        redirect('/admin/');
      } else {
        await supabase.auth.signOut();
        redirect('/login?error=Apenas administradores podem acessar');
      }
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      <div className="hidden lg:flex w-1/2 bg-primary justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_bottom,transparent,white)]"></div>
        <div className="relative z-10 text-center px-8 max-w-md">
          <div className="mb-8">
            <div className=" rounded-2xl backdrop-blur-sm mb-6 inline-block">
              <Image  src="/logounisal.svg" color='white' alt="Logo UNISAL" width={250} height={250} className="invert-0" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl shadow-sm">
          <div className="text-center space-y-2">
            <div className="flex justify-center items-center lg:hidden mb-4">
              <Image src="/logounisal.svg" alt="Logo UNISAL" width={150} height={50} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Bem-vindo de volta</h2>
            <p className="text-gray-500 text-sm">
              Acesse o painel administrativo da biblioteca digital
            </p>
          </div>

          {/* COMPONENTE DO ERRO */}
          {error && <ErrorAlert />}

          <form action={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="pl-10 h-12 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Senha
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-10 h-12 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <SubmitButton />

            <div className="tex-center text-sm">
              <span className="text-gray-500">Não tem uma conta? </span>
              <Link
                href="/register"
                className="text-primary font-medium hover:text-primary/80 transition-colors"
              >
                Criar conta
              </Link>
            </div>
          </form>

          <div className="pt-4 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} UNISAL. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}