"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Book, Users, BookOpen, Library, Sparkles } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { BookLoanChart } from "@/components/dashboard/book-loan-chart"
import { LoanStatusChart } from "@/components/dashboard/loan-status-chart"
import { PopularBooksTable } from "@/components/dashboard/popular-books-table"
import { RecentLoansTable } from "@/components/dashboard/recent-loans-table"
import { getAllDashboardData } from "./books/actions"
import { StatCard } from "@/components/dashboard/StatCard"

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
]

// Componente principal do Dashboard
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStat[]>(initialStats)
  const [monthlyLoans, setMonthlyLoans] = useState<MonthlyLoanData[]>([])
  const [loanStatus, setLoanStatus] = useState<LoanStatusData[]>([])
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([])
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([])
  const [libraryName, setLibraryName] = useState<string>("...")
  const [loading, setLoading] = useState(true)

  // Função para buscar dados
  const fetchDashboardData = async () => {
    try {
      const data = await getAllDashboardData()

      // Atualizar com cores mais vibrantes para o gráfico de status
      const updatedLoanStatus = data.loanStatus.map((status, index) => {
        const colors = [
          "#4f46e5", // indigo
          "#10b981", // emerald
          "#ef4444", // red
          "#f59e0b", // amber
          "#6366f1", // indigo lighter
        ]
        return {
          ...status,
          color: colors[index % colors.length],
        }
      })

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
      setLoanStatus(updatedLoanStatus)
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto space-y-8 p-4 md:p-8">
        {/* Header com design simplificado */}
        <div className="dashboard-header">
          <div className="border-2 rounded-xl bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Library className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center gap-2">
                  {loading ? (
                    <Skeleton className="h-10 w-48" />
                  ) : (
                    <>
                      <span>{libraryName}</span>
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                    </>
                  )}
                </h1>
                <p className="text-gray-600 mt-1 text-lg">Visão geral da sua biblioteca e atividades recentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} loading={loading} index={index} />
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

