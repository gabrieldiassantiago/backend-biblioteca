import { Suspense } from "react"
import { AddBookButton } from "@/components/books/add-book-button"
import { BookList } from "@/components/books/book-list"
import { BookListSkeleton } from "@/components/books/book-skeleton"

import { BookOpen } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ViewToggle } from "@/components/books/view-toggle"
import { BookStats } from "@/components/books/book-stats"
import { BookSearch } from "@/components/books/book-search"
import { BookFilters } from "@/components/books/book-filters"

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string
    search?: string
    status?: string
    author?: string
    sort?: string
    view?: string
  }>
}) {
  const params = await searchParams
  const page = params.page ? Number.parseInt(params.page) : 1
  const search = params.search || ""
  const status = params.status || ""
  const author = params.author || ""
  const sort = params.sort || "newest"
  const view = params.view || "grid"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    Livros
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Gerencie seu acervo de livros
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <ViewToggle currentView={view} />
              <AddBookButton />
            </div>
          </div>

          {/* Quick Stats */}
          <Suspense fallback={<StatsSkeletonLoader />}>
            <BookStats />
          </Suspense>
        </div>

        {/* Search and Filters Section */}
        <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Search Bar */}
              <BookSearch defaultValue={search} />
              
              <Separator />
              
              {/* Filters */}
              <BookFilters 
                currentStatus={status}
                currentAuthor={author}
                currentSort={sort}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {search && (
                <span className="flex items-center gap-1">
                  Resultados para <strong className="text-foreground">{search}</strong>
                </span>
              )}
              {(status || author) && (
                <span className="flex items-center gap-1">
                  • Filtros aplicados
                </span>
              )}
            </div>
          </div>

          {/* Book List */}
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <Suspense fallback={<BookListSkeleton />}>
              <BookList 
                page={page} 
                search={search}
                status={status}
                author={author}
                sort={sort}
                view={view}
              />
            </Suspense>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Skeleton para as estatísticas
function StatsSkeletonLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
