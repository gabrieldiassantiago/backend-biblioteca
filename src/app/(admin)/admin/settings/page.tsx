import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import SettingsFormWrapper from "./settings-form-wrapper"
import MembersManagement from "./member-section"

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
  )

  const MembersSkeleton = () => (
    <div className="space-y-6">
      <div className="rounded-md border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações da Biblioteca</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie as informações, detalhes de contato e membros da sua biblioteca.
        </p>
      </div>

      <div className="space-y-8">
        {/* Configurações da Biblioteca */}
        <Suspense fallback={<FormSkeleton />}>
          <SettingsFormWrapper />
        </Suspense>

        {/* Gerenciamento de Membros */}
        <Suspense fallback={<MembersSkeleton />}>
          <MembersManagement />
        </Suspense>
      </div>
    </div>
  )
}
