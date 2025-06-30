import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, TrendingUp, Package, AlertTriangle } from "lucide-react"

async function getBookStats() {
  const supabase = await createClient()

  // Get user's library_id
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase.from("users").select("library_id").eq("id", user.id).single()

  if (!userData?.library_id) return null

  // Get book statistics
  const { data: books } = await supabase.from("books").select("stock, available").eq("library_id", userData.library_id)

  if (!books) return null

  const totalBooks = books.length
  const totalStock = books.reduce((sum, book) => sum + book.stock, 0)
  const totalAvailable = books.reduce((sum, book) => sum + book.available, 0)
  const lowStockBooks = books.filter((book) => book.available < book.stock * 0.3).length

  return {
    totalBooks,
    totalStock,
    totalAvailable,
    lowStockBooks,
    borrowedBooks: totalStock - totalAvailable,
  }
}

export async function BookStats() {
  const stats = await getBookStats()

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total de Livros",
      value: stats.totalBooks,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      description: "títulos únicos",
    },
    {
      title: "Estoque Total",
      value: stats.totalStock,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      description: "exemplares",
    },
    {
      title: "Disponíveis",
      value: stats.totalAvailable,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      description: "para empréstimo",
    },
    {
      title: "Estoque Baixo",
      value: stats.lowStockBooks,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      description: "precisam atenção",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
