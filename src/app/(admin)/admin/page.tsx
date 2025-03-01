"use client"

import { BookLoanChart } from "@/components/dashboard/book-loan-chart"
import { LoanStatusChart } from "@/components/dashboard/loan-status-chart"
import { PopularBooksTable } from "@/components/dashboard/popular-books-table"
import { RecentLoansTable } from "@/components/dashboard/recent-loans-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Users, BookOpen, TrendingUp } from 'lucide-react'
import { useEffect, useState } from "react"
import { getAllDashboardData } from "./books/actions"

interface DashboardStat {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
}

interface MonthlyLoanData {
  name: string;
  emprestimos: number;
}

interface LoanStatusData {
  name: string;
  value: number;
  color: string;
}

interface PopularBook {
  id: string;
  title: string;
  author: string;
  loans: number;
  available: number;
  stock: number;
}

interface RecentLoan {
  id: string;
  book: string;
  user: string;
  date: string;
  dueDate: string;
  status: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStat[]>([
    { title: "Total de Livros", value: "...", icon: Book, trend: "..." },
    { title: "Usuários Ativos", value: "...", icon: Users, trend: "..." },
    { title: "Empréstimos Ativos", value: "...", icon: BookOpen, trend: "..." },
    { title: "Visitas Mensais", value: "...", icon: TrendingUp, trend: "..." },
  ])
  const [monthlyLoans, setMonthlyLoans] = useState<MonthlyLoanData[]>([])
  const [loanStatus, setLoanStatus] = useState<LoanStatusData[]>([])
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([])
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllDashboardData()
        setStats([
          { 
            title: "Total de Livros", 
            value: data.stats.totalBooks.toString(), 
            icon: Book, 
            trend: `${data.stats.booksTrend > 0 ? '+' : ''}${data.stats.booksTrend}%` 
          },
          { 
            title: "Usuários Ativos", 
            value: data.stats.activeUsers.toString(), 
            icon: Users, 
            trend: `${data.stats.usersTrend > 0 ? '+' : ''}${data.stats.usersTrend}%` 
          },
          { 
            title: "Empréstimos Ativos", 
            value: data.stats.activeLoans.toString(), 
            icon: BookOpen, 
            trend: `${data.stats.loansTrend > 0 ? '+' : ''}${data.stats.loansTrend}%` 
          },
          { 
            title: "Visitas Mensais", 
            value: data.stats.monthlyVisits.toString(), 
            icon: TrendingUp, 
            trend: `${data.stats.visitsTrend > 0 ? '+' : ''}${data.stats.visitsTrend}%` 
          },
        ])
        setMonthlyLoans(data.monthlyLoans)
        setLoanStatus(data.loanStatus)
        setPopularBooks(data.popularBooks)
        setRecentLoans(data.recentLoans)
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
        setStats([
          { title: "Total de Livros", value: "0", icon: Book, trend: "0%" },
          { title: "Usuários Ativos", value: "0", icon: Users, trend: "0%" },
          { title: "Empréstimos Ativos", value: "0", icon: BookOpen, trend: "0%" },
          { title: "Visitas Mensais", value: "0", icon: TrendingUp, trend: "0%" },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-muted"></div>
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? (
                  <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                ) : (
                  <span className={stat.trend.startsWith("+") ? "text-green-600" : "text-red-600"}>
                    {stat.trend}
                  </span>
                )}{" "}
                {!loading && "em relação ao mês passado"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BookLoanChart data={monthlyLoans} loading={loading} />
        <LoanStatusChart data={loanStatus} loading={loading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentLoansTable loans={recentLoans} loading={loading} />
        <PopularBooksTable books={popularBooks} loading={loading} />
      </div>
    </div>
  )
}