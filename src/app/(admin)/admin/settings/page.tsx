import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsFormWrapper from "./settings-form-wrapper";

export default function SettingsPage() {

  const FormSkeleton = () => (
    <div className="space-y-6 max-w-4xl">
      {/* Título + descrição */}
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/5" />

      {/* Card */}
      <div className="rounded-md border p-6 space-y-6">
        {/* Grupo 1 */}
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />

        {/* Grupo 2 */}
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-full" />

        {/* Grid (2 col) */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Botão */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações da Biblioteca</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie as informações e detalhes de contato da sua biblioteca.
        </p>
      </div>

      <Suspense fallback={<FormSkeleton />}>
        <SettingsFormWrapper />
      </Suspense>
    </div>
  );
}
