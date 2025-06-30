import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportsLoanStatusChart } from "./reports-loan-status-chart";
import { ReportsMonthlyLoansChart } from "./reports-monthly-loans-chart";

// Interfaces para os dados dos gráficos
interface MonthlyLoanData {
  name: string;
  emprestimos: number;
}

interface LoanStatusData {
  name: string;
  value: number;
  color: string;
}

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[350px] w-full" />
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

  // Fetch all counts
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

  // Fetch monthly loans data (real data from Supabase)
  const { data: monthlyLoansRaw, error: monthlyLoansError } = await supabase
    .from("loans")
    .select("created_at")
    .eq("library_id", libraryId)
    .gte("created_at", new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()) // Últimos 12 meses
    .order("created_at", { ascending: true });

  if (monthlyLoansError) {
    console.error("Erro ao buscar dados de empréstimos mensais:", monthlyLoansError);
    throw new Error("Erro ao carregar dados de empréstimos mensais");
  }

  // Processar dados para o formato do gráfico
  const monthlyLoansData: MonthlyLoanData[] = [];
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  // Inicializar array com 12 meses zerados
  const monthlyCounts: { [key: string]: number } = {};
  months.forEach((month, index) => {
    monthlyCounts[index] = 0;
  });

  // Contar empréstimos por mês
  monthlyLoansRaw.forEach((loan) => {
    const date = new Date(loan.created_at);
    const monthIndex = date.getMonth();
    monthlyCounts[monthIndex]++;
  });

  // Formatar dados para o gráfico
  months.forEach((month, index) => {
    monthlyLoansData.push({
      name: month,
      emprestimos: monthlyCounts[index],
    });
  });

  // Prepare data for loan status chart
  const loanStatusData: LoanStatusData[] = [
    { name: "Ativos", value: emprestimosAtivos ?? 0, color: "#f59e0b" }, // amber-500
    { name: "Devolvidos", value: emprestimosDevolvidos ?? 0, color: "#10b981" }, // emerald-500
    { name: "Atrasados", value: emprestimosAtrasados ?? 0, color: "#ef4444" }, // red-500
  ];

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportsMonthlyLoansChart data={monthlyLoansData} loading={false} />
        <ReportsLoanStatusChart data={loanStatusData} loading={false} />
      </div>
    </div>
  );
}