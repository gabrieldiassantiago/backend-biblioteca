"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Filter, RotateCcw, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface UsersFiltersProps {
  currentGrade?: string
  currentSort?: string
}

export function UsersFilters({ currentGrade, currentSort }: UsersFiltersProps) {
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
      router.push(`/admin/users?${params.toString()}`)
    }
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("grade")
    params.delete("sort")
    params.delete("page")
    router.push(`/admin/users?${params.toString()}`)
  }

  const hasActiveFilters = currentGrade || (currentSort && currentSort !== "newest")

  return (
    <div className="space-y-4 flex gap-12 flex-col md:flex-row items-start md:items-center justify-center"> 
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
        {/* Grade Filter */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Série/Ano</label>
          <Select value={currentGrade || "all"} onValueChange={(value) => updateFilter("grade", value)}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Todas as séries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as séries</SelectItem>
              <SelectItem value="6º Ano - Fundamental">6º Ano - Fundamental</SelectItem>
              <SelectItem value="7º Ano - Fundamental">7º Ano - Fundamental</SelectItem>
              <SelectItem value="8º Ano - Fundamental">8º Ano - Fundamental</SelectItem>
              <SelectItem value="9º Ano - Fundamental">9º Ano - Fundamental</SelectItem>
              <SelectItem value="1º Ano - Médio">1º Ano - Médio</SelectItem>
              <SelectItem value="2º Ano - Médio">2º Ano - Médio</SelectItem>
              <SelectItem value="3º Ano - Médio">3º Ano - Médio</SelectItem>
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
              <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
              <SelectItem value="email-asc">Email (A-Z)</SelectItem>
              <SelectItem value="email-desc">Email (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentGrade && (
            <Badge variant="secondary" className="gap-1">
              Série: {currentGrade}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("grade", "")}
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
