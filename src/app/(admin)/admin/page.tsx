"use client"

import { BookLoanChart } from "@/components/dashboard/book-loan-chart"
import { LoanStatusChart } from "@/components/dashboard/loan-status-chart"
import { PopularBooksTable } from "@/components/dashboard/popular-books-table"
import { RecentLoansTable } from "@/components/dashboard/recent-loans-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Users, BookOpen, TrendingUp } from 'lucide-react'
import { useEffect, useState } from "react"
import { getDashboardStats } from "./books/actions"

interface DashboardStat {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStat[]>([
    { title: "Total de Livros", value: "...", icon: Book, trend: "..." },
    { title: "Usuários Ativos", value: "...", icon: Users, trend: "..." },
    { title: "Empréstimos Ativos", value: "...", icon: BookOpen, trend: "..." },
    { title: "Visitas Mensais", value: "...", icon: TrendingUp, trend: "..." },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats()
        setStats([
          { 
            title: "Total de Livros", 
            value: data.totalBooks.toString(), 
            icon: Book, 
            trend: `${data.booksTrend > 0 ? '+' : ''}${data.booksTrend}%` 
          },
          { 
            title: "Usuários Ativos", 
            value: data.activeUsers.toString(), 
            icon: Users, 
            trend: `${data.usersTrend > 0 ? '+' : ''}${data.usersTrend}%` 
          },
          { 
            title: "Empréstimos Ativos", 
            value: data.activeLoans.toString(), 
            icon: BookOpen, 
            trend: `${data.loansTrend > 0 ? '+' : ''}${data.loansTrend}%` 
          },
          { 
            title: "Visitas Mensais", 
            value: data.monthlyVisits.toString(), 
            icon: TrendingUp, 
            trend: `${data.visitsTrend > 0 ? '+' : ''}${data.visitsTrend}%` 
          },
        ])
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
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
        <BookLoanChart />
        <LoanStatusChart />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentLoansTable />
        <PopularBooksTable />
      </div>
    </div>
  )
}
