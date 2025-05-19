import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function ReportsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Relatórios da Biblioteca</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shadow-sm rounded-md border p-4">
            <div className="flex flex-row items-center gap-3 pb-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="py-2">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPageWrapper() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsPage />
    </Suspense>
  );
}

async function ReportsPage() {
  const supabase = await createClient();

  // Pega usuário autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Usuário não autenticado");
  }

  // Pega o library_id do usuário
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.library_id) {
    throw new Error("Usuário sem biblioteca vinculada");
  }

  const libraryId = userData.library_id;

  // Buscar totais filtrados pela library_id
  const { count: totalAlunos } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "student")
    .eq("library_id", libraryId);

  const { count: totalLivros } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true })
    .eq("library_id", libraryId);

  const { count: totalEmprestimos } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true })
    .eq("library_id", libraryId);

  const { count: emprestimosAtivos } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("library_id", libraryId);

  const { count: emprestimosDevolvidos } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true })
    .eq("status", "returned")
    .eq("library_id", libraryId);

  const { count: emprestimosAtrasados } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true })
    .eq("status", "overdue")
    .eq("library_id", libraryId);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Relatórios da Biblioteca</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAlunos ?? '-'}</div>
            <CardDescription>Total de estudantes cadastrados</CardDescription>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">Livros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLivros ?? '-'}</div>
            <CardDescription>Total de livros cadastrados</CardDescription>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">Empréstimos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEmprestimos ?? '-'}</div>
            <CardDescription>Total de empréstimos realizados</CardDescription>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Clock className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{emprestimosAtivos ?? '-'}</div>
            <CardDescription>Empréstimos em andamento</CardDescription>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle className="text-lg">Devolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{emprestimosDevolvidos ?? '-'}</div>
            <CardDescription>Empréstimos devolvidos</CardDescription>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <CardTitle className="text-lg">Atrasados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{emprestimosAtrasados ?? '-'}</div>
            <CardDescription>Empréstimos em atraso</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
