"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Book, Users, BookOpen, Library, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

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
          "#4338ca", // indigo-700
          "#059669", // emerald-600
          "#e11d48", // rose-600
          "#d97706", // amber-600
          "#7c3aed", // violet-600
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
    <div className="min-h-screen ">
      <motion.div
        className="mx-auto space-y-6 p-4 md:p-8 max-w-7xl"
        initial="hidden"
        animate="show"
        variants={container}
      >
        {/* Header com design sutil e integrado */}
        <motion.div variants={item} className="dashboard-header">
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center gap-2 text-gray-700">
                <Library className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium">Biblioteca:</span>
              </div>
              <div className="ml-2">
                {loading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <span className="text-base text-gray-800">{libraryName}</span>
                )}
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="text-xs text-gray-500 hidden md:block">
                  Última atualização: {new Date().toLocaleDateString()}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-50 hover:bg-gray-100 rounded-md px-3 py-1.5 flex items-center gap-1.5 text-xs text-gray-700 font-medium border border-gray-200 transition-colors"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Atualizar dados</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div key={index} variants={item}>
              <StatCard stat={stat} loading={loading} index={index} />
            </motion.div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div variants={item}>
            <BookLoanChart data={monthlyLoans} loading={loading} />
          </motion.div>
          <motion.div variants={item}>
            <LoanStatusChart data={loanStatus} loading={loading} />
          </motion.div>
        </div>

        {/* Tabelas */}
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div variants={item}>
            <RecentLoansTable loans={recentLoans} loading={loading} />
          </motion.div>
          <motion.div variants={item}>
            <PopularBooksTable books={popularBooks} loading={loading} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

