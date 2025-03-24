import { ElementType } from "react"

export interface DashboardStat {
  title: string
  value: string
  icon: ElementType
  trend: string
}

export interface MonthlyLoanData {
  name: string
  emprestimos: number
}

export interface LoanStatusData {
  name: string
  value: number
  color: string
}

export interface PopularBook {
  id: string
  title: string
  author: string
  loans: number
  available: number
  stock: number
}

export interface RecentLoan {
  id: string
  book: string
  user: string
  date: string
  dueDate: string
  status: string
}

export interface DashboardStats {
  totalBooks: number
  booksTrend: number
  activeUsers: number
  usersTrend: number
  activeLoans: number
  loansTrend: number
  monthlyVisits: number
  visitsTrend: number
}

export interface DashboardData {
  stats: DashboardStats
  monthlyLoans: MonthlyLoanData[]
  loanStatus: LoanStatusData[]
  popularBooks: PopularBook[]
  recentLoans: RecentLoan[]
  libraryName: string
}