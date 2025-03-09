"use client"

import React, { useEffect, useState } from "react"
import { Book, Users, BookOpen, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookLoanChart } from "@/components/dashboard/book-loan-chart"
import { LoanStatusChart } from "@/components/dashboard/loan-status-chart"
import { PopularBooksTable } from "@/components/dashboard/popular-books-table"
import { RecentLoansTable } from "@/components/dashboard/recent-loans-table"
import { getAllDashboardData } from "./books/actions"

// Interfaces
interface DashboardStat {
  title: string
  value: string
  icon: React.ElementType
  trend: string
}

interface MonthlyLoanData {
  name: string
  emprestimos: number
}

interface LoanStatusData {
  name: string
  value: number
  color: string
}

interface PopularBook {
  id: string
  title: string
  author: string
  loans: number
  available: number
  stock: number
}

interface RecentLoan {
  id: string
  book: string
  user: string
  date: string
  dueDate: string
  status: string
}

// Dados iniciais
const initialStats: DashboardStat[] = [
  { title: "Total de Livros", value: "...", icon: Book, trend: "..." },
  { title: "Usuários Ativos", value: "...", icon: Users, trend: "..." },
  { title: "Empréstimos Ativos", value: "...", icon: BookOpen, trend: "..." },
  { title: "Visitas Mensais", value: "...", icon: TrendingUp, trend: "..." },
]

// Componente para exibir uma estatística individual
const StatCard: React.FC<{ stat: DashboardStat; loading: boolean }> = ({ stat, loading }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
      <stat.icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {loading ? <Skeleton className="h-7 w-16" /> : stat.value}
      </div>
      <p className="text-xs text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <span className={stat.trend.startsWith("+") ? "text-green-600" : "text-red-600"}>
            {stat.trend}
          </span>
        )}{" "}
        {!loading && "em relação ao mês passado"}
      </p>
    </CardContent>
  </Card>
)

// Componente principal do Dashboard
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStat[]>(initialStats)
  const [monthlyLoans, setMonthlyLoans] = useState<MonthlyLoanData[]>([])
  const [loanStatus, setLoanStatus] = useState<LoanStatusData[]>([])
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([])
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([])
  const [loading, setLoading] = useState(true)

  // Função para buscar dados
  const fetchDashboardData = async () => {
    try {
      const data = await getAllDashboardData()
      setStats([
        {
          title: "Total de Livros",
          value: data.stats.totalBooks.toString(),
          icon: Book,
          trend: `${data.stats.booksTrend > 0 ? "+" : ""}${data.stats.booksTrend}%`,
        },
        {
          title: "Usuários Ativos",
          value: data.stats.activeUsers.toString(),
          icon: Users,
          trend: `${data.stats.usersTrend > 0 ? "+" : ""}${data.stats.usersTrend}%`,
        },
        {
          title: "Empréstimos Ativos",
          value: data.stats.activeLoans.toString(),
          icon: BookOpen,
          trend: `${data.stats.loansTrend > 0 ? "+" : ""}${data.stats.loansTrend}%`,
        },
       
      ])
      setMonthlyLoans(data.monthlyLoans)
      setLoanStatus(data.loanStatus)
      setPopularBooks(data.popularBooks)
      setRecentLoans(data.recentLoans)
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} loading={loading} />
        ))}
        
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <BookLoanChart data={monthlyLoans} loading={loading} />
        <LoanStatusChart data={loanStatus} loading={loading} />
      </div>

      {/* Tabelas */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentLoansTable loans={recentLoans} loading={loading} />
        <PopularBooksTable books={popularBooks} loading={loading} />
      </div>
    </div>
  )
}