"use client"

import React, { useEffect, useState } from "react"
import { Book, Users, BookOpen, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'

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
  <Card className="overflow-hidden border-none bg-gradient-to-br from-card to-card/80 shadow-md transition-all hover:shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        <stat.icon className="h-4 w-4 text-primary" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold tracking-tight">
        {loading ? <Skeleton className="h-8 w-20" /> : stat.value}
      </div>
      <div className="mt-2 flex items-center text-xs">
        {loading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <>
            {stat.trend.startsWith("+") ? (
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="mr-1 h-3 w-3 text-rose-500" />
            )}
            <span
              className={
                stat.trend.startsWith("+") ? "text-emerald-500" : "text-rose-500"
              }
            >
              {stat.trend}
            </span>
            <span className="ml-1 text-muted-foreground">em relação ao mês passado</span>
          </>
        )}
      </div>
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
  const [libraryName, setLibraryName] = useState<string>("...") // Estado para o nome da biblioteca
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
        {
          title: "Visitas Mensais",
          value: data.stats.monthlyVisits?.toString() || "0",
          icon: TrendingUp,
          trend: `${data.stats.visitsTrend > 0 ? "+" : ""}${data.stats.visitsTrend}%`,
        },
      ])
      setMonthlyLoans(data.monthlyLoans)
      setLoanStatus(data.loanStatus)
      setPopularBooks(data.popularBooks)
      setRecentLoans(data.recentLoans)
      setLibraryName(data.libraryName || "Biblioteca Sem Nome") 
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
      setLibraryName("Erro ao carregar nome")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 rounded-2xl">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
           Olá, biblioteca {loading ? <Skeleton className="h-10 w-48" /> : libraryName}
          </h1>
          <p className="text-muted-foreground">
            Visão geral da sua biblioteca e atividades recentes
          </p>
        </div>

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
    </div>
  )
}