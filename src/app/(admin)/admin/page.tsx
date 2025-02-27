"use client"

import { BookLoanChart } from "@/components/dashboard/book-loan-chart"
import { LoanStatusChart } from "@/components/dashboard/loan-status-chart"
import { PopularBooksTable } from "@/components/dashboard/popular-books-table"
import { RecentLoansTable } from "@/components/dashboard/recent-loans-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Users, BookOpen, TrendingUp } from "lucide-react"


export default function AdminDashboardPage() {
  // Dados fictícios para demonstração
  const stats = [
    { title: "Total de Livros", value: "1,234", icon: Book, trend: "+5%" },
    { title: "Usuários Ativos", value: "567", icon: Users, trend: "+2%" },
    { title: "Empréstimos Ativos", value: "89", icon: BookOpen, trend: "-3%" },
    { title: "Visitas Mensais", value: "12,345", icon: TrendingUp, trend: "+10%" },
  ]

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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.trend.startsWith("+") ? "text-green-600" : "text-red-600"}>{stat.trend}</span> em
                relação ao mês passado
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