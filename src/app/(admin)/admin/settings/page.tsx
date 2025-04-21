import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SettingsFormWrapper from "./settings-form-wrapper";

// Componente da página de Configurações
export default function SettingsPage() {
  return (
    // Container principal com padding e largura máxima
    <div className=" w-max-7xl py-10 px-4 sm:px-6 lg:px-8">
      {/* Cabeçalho da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configurações da Biblioteca</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie as informações e detalhes de contato da sua biblioteca.
        </p>
      </div>
      
      {/* Suspense para lidar com o carregamento assíncrono do formulário */}
      <Suspense
        fallback={
          // Exibe um indicador de carregamento enquanto os dados são buscados
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-500">Carregando configurações...</span>
          </div>
        }
      >
        {/* Renderiza o wrapper do formulário que buscará os dados */}
        <SettingsFormWrapper />
      </Suspense>
    </div>
  );
}
