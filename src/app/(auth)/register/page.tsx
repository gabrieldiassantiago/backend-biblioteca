'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BookOpen, Mail, User, Lock, Library } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [libraryName, setLibraryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!libraryName) {
      setError('O nome da biblioteca é obrigatório.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: 'admin' }, // Define role como 'admin' por padrão
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user) {
      // Criar a biblioteca
      const { data: library, error: libraryError } = await supabase
        .from('libraries')
        .insert({ name: libraryName })
        .select('id')
        .single();

      if (libraryError) {
        setError('Erro ao criar biblioteca. Tente novamente.');
        setLoading(false);
        return;
      }

      // Inserir na tabela users como admin, associado à biblioteca
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'admin',
        library_id: library.id,
      });

      window.location.href = '/admin';
    }
  };

  useEffect(() => {
    const input = document.getElementById('fullName');
    if (input) input.focus();
  }, []);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Section - Illustration */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/90 to-primary/70 justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_bottom,transparent,white)]"></div>
        <div className="relative z-10 text-center px-8 max-w-md">
          <BookOpen className="mx-auto h-20 w-20 text-white mb-6 opacity-90" strokeWidth={1.5} />
          <h1 className="text-3xl font-bold text-white mb-3">
       Quero ser membro 
          </h1>
          <p className="text-white/80 text-lg">
            Crie sua conta e sua biblioteca para começar a gerenciar hoje mesmo!
          </p>
        </div>
      </div>

      {/* Right Section - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <BookOpen className="h-12 w-12 mx-auto text-primary lg:hidden" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold text-foreground">Registrar Administrador</h2>
            <p className="text-muted-foreground text-sm">
              Preencha os dados para criar sua conta
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-4">
              {/* Full Name Input */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu Nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Library Name Input */}
              <div className="space-y-2">
                <Label htmlFor="libraryName" className="text-sm font-medium">
                  Nome da Biblioteca
                </Label>
                <div className="relative">
                  <Library className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="libraryName"
                    type="text"
                    placeholder="Nome da Biblioteca"
                    value={libraryName}
                    onChange={(e) => setLibraryName(e.target.value)}
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
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>

            {/* Login Link */}
            <p className="text-sm text-center text-muted-foreground">
              Já tem conta?{' '}
              <Link 
                href="/login" 
                className="text-primary hover:underline font-medium"
              >
                Faça login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}