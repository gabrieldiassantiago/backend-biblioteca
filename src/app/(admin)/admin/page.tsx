"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Book, Users, BookOpen, Library, RefreshCw } from 'lucide-react'
import { motion } from "framer-motion"

import { Skeleton } from "@/components/ui/skeleton"
import { BookLoanChart } from "@/components/dashboard/book-loan-chart"
import { LoanStatusChart } from "@/components/dashboard/loan-status-chart"
import { PopularBooksTable } from "@/components/dashboard/popular-books-table"
import { RecentLoansTable } from "@/components/dashboard/recent-loans-table"
import { getAllDashboardData } from "./books/actions"
import { StatCard } from "@/components/dashboard/StatCard"
import { Button } from "@/components/ui/button"

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
  const [stats, setStats] = useState<DashboardStat[]>(initialStats);
  const [monthlyLoans, setMonthlyLoans] = useState<MonthlyLoanData[]>([]);
  const [loanStatus, setLoanStatus] = useState<LoanStatusData[]>([]);
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([]);
  const [libraryName, setLibraryName] = useState<string>("...");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const data = await getAllDashboardData();

      const updatedLoanStatus = data.loanStatus.map((status, index) => {
        const colors = [
          "#8b5cf6", // violet-500
          "#14b8a6", // teal-500
          "#f43f5e", // rose-500
          "#f59e0b", // amber-500
          "#8b5cf6", // violet-500
        ];
        return {
          ...status,
          color: colors[index % colors.length],
        };
      });

      setStats([
        {
          title: "Total de Livros",
          value: data.stats.totalBooks.toString(),
          icon: Book,
          trend: `${data.stats.booksTrend > 0 ? "+" : ""}${data.stats.booksTrend}%`,
        },
        {
          title: "Total de Usuários",
          value: data.stats.totalUsers.toString(),
          icon: Users,
          trend: `${data.stats.usersTrend > 0 ? "+" : ""}${data.stats.usersTrend}%`,
        },
        {
          title: "Empréstimos Ativos",
          value: data.stats.activeLoans.toString(),
          icon: BookOpen,
          trend: `${data.stats.loansTrend > 0 ? "+" : ""}${data.stats.loansTrend}%`,
        },
      ]);
      setMonthlyLoans(data.monthlyLoans);
      setLoanStatus(updatedLoanStatus);
      setPopularBooks(data.popularBooks);
      setRecentLoans(data.recentLoans);
      setLibraryName(data.libraryName || "Biblioteca Sem Nome");
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      setLibraryName("Erro ao carregar nome");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      <motion.div
        className="mx-auto space-y-6 p-6 max-w-7xl"
        initial="hidden"
        animate="show"
        variants={container}
      >
        {/* Header com design minimalista */}
        <motion.div variants={item} className="dashboard-header">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-violet-100">
                <Library className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                {loading ? (
                  <Skeleton className="h-5 w-40" />
                ) : (
                  <p className="text-sm text-gray-500">{libraryName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden md:block">
                Última atualização: {new Date().toLocaleDateString()}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={fetchDashboardData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </Button>
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
