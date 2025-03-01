"use server"

import { createClient } from "@/lib/supabase/server"
import { cache } from "react"
import { revalidatePath } from "next/cache"

async function getUserLibraryId() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData?.library_id) {
    throw new Error("Usuário não está vinculado a uma biblioteca")
  }

  return userData.library_id
}

export async function handleSubmitBook(formData: FormData) {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  const bookId = formData.get("id") as string | null
  const title = formData.get("title") as string
  const author = formData.get("author") as string
  const isbn = formData.get("isbn") as string

  const stockStr = formData.get("stock")
  if (!stockStr || typeof stockStr !== "string") {
    throw new Error("O estoque deve ser um número inteiro válido.")
  }
  const stock = Number.parseInt(stockStr, 10)
  if (isNaN(stock) || stock < 0) {
    throw new Error("O estoque não pode ser negativo.")
  }

  const availableStr = formData.get("available")
  if (!availableStr || typeof availableStr !== "string") {
    throw new Error("A quantidade disponível deve ser um número inteiro válido.")
  }
  const available = Number.parseInt(availableStr, 10)
  if (isNaN(available) || available < 0) {
    throw new Error("A quantidade disponível não pode ser negativa.")
  }
  if (available > stock) {
    throw new Error("A quantidade disponível não pode ser maior que o estoque.")
  }

  try {
    if (bookId) {
      const { data: existingBook } = await supabase.from("books").select("library_id").eq("id", bookId).single()

      if (existingBook?.library_id !== libraryId) {
        throw new Error("Você não tem permissão para editar este livro")
      }

      const { error: updateError } = await supabase
        .from("books")
        .update({
          title,
          author,
          isbn,
          stock,
          available,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookId)
        .eq("library_id", libraryId)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase.from("books").insert({
        title,
        author,
        isbn,
        stock,
        available,
        library_id: libraryId,
      })

      if (insertError) throw insertError
    }

    revalidatePath("/admin/books")
    revalidatePath("/dashboard")
  } catch (error) {
    console.error("Erro ao salvar livro:", error)
    throw new Error("Erro ao salvar livro")
  }
}

export async function handleDeleteBook(bookId: string) {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  try {
    const { data: book } = await supabase.from("books").select("library_id").eq("id", bookId).single()

    if (book?.library_id !== libraryId) {
      throw new Error("Você não tem permissão para excluir este livro")
    }

    const { data: activeLoans, error: loansError } = await supabase
      .from("loans")
      .select("id")
      .eq("book_id", bookId)
      .eq("status", "active")
      .limit(1)

    if (loansError) throw loansError
    if (activeLoans && activeLoans.length > 0) {
      throw new Error("Não é possível excluir um livro com empréstimos ativos.")
    }

    const { data: pendingReservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id")
      .eq("book_id", bookId)
      .eq("status", "pending")
      .limit(1)

    if (reservationsError) throw reservationsError
    if (pendingReservations && pendingReservations.length > 0) {
      throw new Error("Não é possível excluir um livro com reservas pendentes.")
    }

    const { error: deleteError } = await supabase.from("books").delete().eq("id", bookId).eq("library_id", libraryId)

    if (deleteError) throw deleteError

    revalidatePath("/admin/books")
    revalidatePath("/dashboard")
  } catch (error) {
    console.error("Erro ao excluir livro:", error)
    throw new Error("Erro ao excluir livro")
  }
}

interface DashboardStats {
  totalBooks: number
  booksTrend: number
  activeUsers: number
  usersTrend: number
  activeLoans: number
  loansTrend: number
  monthlyVisits: number
  visitsTrend: number
}

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1)

  try {
    const [
      { count: totalBooks },
      { count: newBooks },
      { count: lastMonthBooks },
      { count: activeUsers },
      { count: newUsers },
      { count: lastMonthUsers },
      { count: activeLoans },
      { count: newLoans },
      { count: lastMonthLoans },
    ] = await Promise.all([
      supabase.from("books").select("*", { count: "exact", head: true }).eq("library_id", libraryId),
      supabase.from("books").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", lastMonth.toISOString()),
      supabase.from("books").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", twoMonthsAgo.toISOString()).lt("created_at", lastMonth.toISOString()),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("library_id", libraryId).eq("status", "active"),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", lastMonth.toISOString()),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", twoMonthsAgo.toISOString()).lt("created_at", lastMonth.toISOString()),
      supabase.from("loans").select("*", { count: "exact", head: true }).eq("library_id", libraryId).eq("status", "active"),
      supabase.from("loans").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", lastMonth.toISOString()),
      supabase.from("loans").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", twoMonthsAgo.toISOString()).lt("created_at", lastMonth.toISOString()),
    ])

    const booksTrend = calculateTrend(newBooks || 0, lastMonthBooks || 0)
    const usersTrend = calculateTrend(newUsers || 0, lastMonthUsers || 0)
    const loansTrend = calculateTrend(newLoans || 0, lastMonthLoans || 0)

    const monthlyVisits = Math.floor(Math.random() * 10000) + 5000
    const lastMonthVisits = Math.floor(Math.random() * 9000) + 4000
    const visitsTrend = calculateTrend(monthlyVisits, lastMonthVisits)

    return {
      totalBooks: totalBooks || 0,
      booksTrend,
      activeUsers: activeUsers || 0,
      usersTrend,
      activeLoans: activeLoans || 0,
      loansTrend,
      monthlyVisits,
      visitsTrend,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    throw new Error("Falha ao carregar estatísticas do dashboard")
  }
})

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

interface MonthlyLoanData {
  name: string
  emprestimos: number
}

export async function getMonthlyLoanData(): Promise<MonthlyLoanData[]> {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  try {
    const months = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleString("pt-BR", { month: "short" })
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      months.push({
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1, 3),
        year,
        month,
      })
    }

    const result = await Promise.all(
      months.map(async ({ name, year, month }) => {
        const startDate = new Date(year, month - 1, 1).toISOString()
        const endDate = new Date(year, month, 0).toISOString()

        const { count } = await supabase
          .from("loans")
          .select("*", { count: "exact", head: true })
          .eq("library_id", libraryId)
          .gte("created_at", startDate)
          .lt("created_at", endDate)

        return {
          name,
          emprestimos: count || 0,
        }
      }),
    )

    return result
  } catch (error) {
    console.error("Erro ao buscar dados de empréstimos mensais:", error)
    throw new Error("Falha ao carregar dados de empréstimos por mês")
  }
}

interface LoanStatusData {
  name: string
  value: number
  color: string
}

export async function getLoanStatusData(): Promise<LoanStatusData[]> {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  try {
    const { data, error } = await supabase.from("loans").select("status").eq("library_id", libraryId)

    if (error) throw error

    const statusCounts = data.reduce(
      (acc: Record<string, number>, loan: { status: string }) => {
        acc[loan.status] = (acc[loan.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return [
      { name: "Ativos", value: statusCounts["active"] || 0, color: "hsl(var(--chart-2))" },
      { name: "Devolvidos", value: statusCounts["returned"] || 0, color: "hsl(var(--chart-1))" },
      { name: "Atrasados", value: statusCounts["overdue"] || 0, color: "hsl(var(--chart-3))" },
    ]
  } catch (error) {
    console.error("Erro ao buscar dados de status dos empréstimos:", error)
    throw new Error("Falha ao carregar dados de status dos empréstimos")
  }
}

interface PopularBook {
  id: string
  title: string
  author: string
  loans: number
  available: number
  stock: number
}

export async function getPopularBooks(): Promise<PopularBook[]> {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  try {
    const { data, error } = await supabase
      .rpc('get_popular_books', { library_id: libraryId })
      .limit(5)

    if (error) throw error

    return data.map((book: PopularBook) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      loans: book.loans || 0,
      available: book.available,
      stock: book.stock,
    }))
  } catch (error) {
    console.error("Erro ao buscar livros populares:", error)
    throw new Error("Falha ao carregar livros populares")
  }
}

interface RecentLoan {
  id: string
  book: string
  user: string
  date: string
  dueDate: string
  status: string
}

interface RawLoan {
  id: string
  created_at: string
  due_date: string
  status: string
  books: { title: string } | null
  users: { full_name: string } | null
}

export async function getRecentLoans(): Promise<RecentLoan[]> {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  try {
    const { data, error } = await supabase
      .from("loans")
      .select(`
        id,
        created_at,
        due_date,
        status,
        books:book_id(title),
        users:user_id(full_name)
      `)
      .eq("library_id", libraryId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) throw error

    // Conversão dupla para contornar a inferência do TypeScript
    return (data as unknown as RawLoan[]).map((loan) => ({
      id: loan.id,
      book: loan.books?.title || "Livro desconhecido",
      user: loan.users?.full_name || "Usuário desconhecido",
      date: loan.created_at,
      dueDate: loan.due_date,
      status: loan.status,
    }))
  } catch (error) {
    console.error("Erro ao buscar empréstimos recentes:", error)
    throw new Error("Falha ao carregar empréstimos recentes")
  }
}

export const getAllDashboardData = cache(async () => {
  const supabase = await createClient()
  const libraryId = await getUserLibraryId()

  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1)

  try {
    const [
      statsResponse,
      monthlyLoansResponse,
      loanStatusResponse,
      popularBooksResponse,
      recentLoansResponse,
    ] = await Promise.all([
      Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }).eq("library_id", libraryId),
        supabase.from("books").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", lastMonth.toISOString()),
        supabase.from("books").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", twoMonthsAgo.toISOString()).lt("created_at", lastMonth.toISOString()),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("library_id", libraryId).eq("status", "active"),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", lastMonth.toISOString()),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", twoMonthsAgo.toISOString()).lt("created_at", lastMonth.toISOString()),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("library_id", libraryId).eq("status", "active"),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", lastMonth.toISOString()),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("library_id", libraryId).gte("created_at", twoMonthsAgo.toISOString()).lt("created_at", lastMonth.toISOString()),
      ]),
      (async () => {
        const months = []
        for (let i = 3; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
          const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()
          const { count } = await supabase
            .from("loans")
            .select("*", { count: "exact", head: true })
            .eq("library_id", libraryId)
            .gte("created_at", startDate)
            .lt("created_at", endDate)
          months.push({
            name: date.toLocaleString("pt-BR", { month: "short" }).charAt(0).toUpperCase() + date.toLocaleString("pt-BR", { month: "short" }).slice(1, 3),
            emprestimos: count || 0
          })
        }
        return months
      })(),
      supabase.from("loans").select("status").eq("library_id", libraryId),
      supabase.rpc('get_popular_books', { library_id: libraryId }).limit(5),
      supabase
        .from("loans")
        .select("id, created_at, due_date, status, books:book_id(title), users:user_id(full_name)")
        .eq("library_id", libraryId)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    // Processar Stats
    const [
      totalBooks,
      newBooks,
      lastMonthBooks,
      activeUsers,
      newUsers,
      lastMonthUsers,
      activeLoans,
      newLoans,
      lastMonthLoans,
    ] = statsResponse.map(r => r.count || 0)
    const booksTrend = calculateTrend(newBooks, lastMonthBooks)
    const usersTrend = calculateTrend(newUsers, lastMonthUsers)
    const loansTrend = calculateTrend(newLoans, lastMonthLoans)
    const monthlyVisits = Math.floor(Math.random() * 10000) + 5000
    const lastMonthVisits = Math.floor(Math.random() * 9000) + 4000
    const visitsTrend = calculateTrend(monthlyVisits, lastMonthVisits)

    const stats = {
      totalBooks,
      booksTrend,
      activeUsers,
      usersTrend,
      activeLoans,
      loansTrend,
      monthlyVisits,
      visitsTrend,
    }

    // Processar Loan Status
    const statusCounts = (loanStatusResponse.data ?? []).reduce(
      (acc: Record<string, number>, loan: { status: string }) => {
        acc[loan.status] = (acc[loan.status] || 0) + 1
        return acc
      },
      {}
    )
    const loanStatus = [
      { name: "Ativos", value: statusCounts["active"] || 0, color: "hsl(var(--chart-2))" },
      { name: "Devolvidos", value: statusCounts["returned"] || 0, color: "hsl(var(--chart-1))" },
      { name: "Atrasados", value: statusCounts["overdue"] || 0, color: "hsl(var(--chart-3))" },
    ]

    // Processar Popular Books
    const popularBooks = (popularBooksResponse.data ?? []).map((book: PopularBook) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      loans: book.loans || 0,
      available: book.available,
      stock: book.stock,
    }))

    // Processar Recent Loans com conversão dupla
    const recentLoans = (recentLoansResponse.data as unknown as RawLoan[] ?? []).map((loan) => ({
      id: loan.id,
      book: loan.books?.title || "Livro desconhecido",
      user: loan.users?.full_name || "Usuário desconhecido",
      date: loan.created_at,
      dueDate: loan.due_date,
      status: loan.status,
    }))

    return {
      stats,
      monthlyLoans: monthlyLoansResponse,
      loanStatus,
      popularBooks,
      recentLoans,
    }
  } catch (error) {
    console.error("Erro ao buscar todos os dados do dashboard:", error)
    throw error
  }
})