import { BookOpen, Users, BarChart3 } from 'lucide-react'
import Image from "next/image"
import { LoginForm } from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/logounisal.svg" alt="Logo UNISAL" width={120} height={40} />
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo de volta</h1>
              <p className="text-slate-500 text-sm">Acesse o painel administrativo da biblioteca digital</p>
            </div>

            <LoginForm />

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} UNISAL. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background com padrão geométrico */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          {/* Formas geométricas */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute top-40 right-32 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
            <div className="absolute bottom-32 left-16 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Conteúdo centralizado */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-12 text-white">
          {/* Logo */}
          <div className="mb-12">
            <Image src="/logounisal.svg" alt="Logo UNISAL" width={200} height={80} className="brightness-0 invert" />
          </div>

          {/* Preview do Dashboard */}
          <div className="mb-8 relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Biblioteca Digital</span>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-slate-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full w-3/4"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-4 w-4 text-slate-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full">
                      <div className="h-2 bg-green-500 rounded-full w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Texto descritivo */}
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-4">Gerencie sua biblioteca digital</h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Acesse ferramentas avançadas para administrar usuários, monitorar atividades e otimizar o acesso ao
              conhecimento.
            </p>
          </div>

          {/* Indicadores de slide */}
          <div className="flex space-x-2 mt-8">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
