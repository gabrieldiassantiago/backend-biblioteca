"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Filter, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface BookFiltersProps {
  currentStatus?: string
  currentAuthor?: string
  currentSort?: string
}

export function BookFilters({ currentStatus, currentAuthor, currentSort }: BookFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentValue = params.get(key) || ""

    // Only update if value actually changed
    if (value !== currentValue) {
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      // Only reset to page 1 when filter changes
      params.delete("page")
      router.push(`/admin/books?${params.toString()}`)
    }
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("status")
    params.delete("author")
    params.delete("sort")
    params.delete("page")
    router.push(`/admin/books?${params.toString()}`)
  }

  const hasActiveFilters = currentStatus || currentAuthor || (currentSort && currentSort !== "newest")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros</span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 px-2 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={currentStatus || "all"} onValueChange={(value) => updateFilter("status", value)}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="low">Estoque baixo</SelectItem>
              <SelectItem value="out">Esgotado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Filter */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
          <Select value={currentSort || "newest"} onValueChange={(value) => updateFilter("sort", value)}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
              <SelectItem value="title-asc">Título (A-Z)</SelectItem>
              <SelectItem value="title-desc">Título (Z-A)</SelectItem>
              <SelectItem value="author-asc">Autor (A-Z)</SelectItem>
              <SelectItem value="author-desc">Autor (Z-A)</SelectItem>
              <SelectItem value="stock-high">Maior estoque</SelectItem>
              <SelectItem value="stock-low">Menor estoque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentStatus && (
            <Badge variant="secondary" className="gap-1">
              Status: {currentStatus}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("status", "")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {currentSort && currentSort !== "newest" && (
            <Badge variant="secondary" className="gap-1">
              Ordem: {currentSort}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("sort", "newest")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
