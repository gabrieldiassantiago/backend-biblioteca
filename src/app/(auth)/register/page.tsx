'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

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
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Lado Esquerdo - Retângulo Preto */}
      <div className="hidden md:flex w-full md:w-1/2 bg-black text-white flex-col justify-center items-center p-8">
        <h1 className="text-4xl font-bold mb-4">Junte-se como Admin</h1>
        <p className="text-lg text-center max-w-md">
          Crie sua conta e sua biblioteca para começar a gerenciar hoje mesmo!
        </p>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Registrar Administrador</h2>
            <p className="text-sm text-muted-foreground">Preencha os dados para criar sua conta</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu Nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="libraryName">Nome da Biblioteca</Label>
              <Input
                id="libraryName"
                type="text"
                placeholder="Nome da Biblioteca"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Já tem conta?{' '}
              <Link href="/admin/auth/login" className="text-primary hover:underline">
                Faça login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}