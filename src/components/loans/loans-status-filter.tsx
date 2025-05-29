"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {  RotateCcw, X, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

interface LoansStatusFilterProps {
  currentStatus: string
  currentSearch: string
}

export function LoansStatusFilter({ currentStatus, currentSearch }: LoansStatusFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(currentSearch || "")

  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearch(searchValue)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchValue])

  const updateSearch = (search: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentValue = params.get("search") || ""

    if (search !== currentValue) {
      if (search && search.trim()) {
        params.set("search", search.trim())
      } else {
        params.delete("search")
      }

      params.delete("page")
      router.push(`/admin/loans?${params.toString()}`)
    }
  }

  const updateFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentValue = params.get("status") || "all"

    if (status !== currentValue) {
      if (status && status !== "all") {
        params.set("status", status)
      } else {
        params.delete("status")
      }

      params.delete("page")
      router.push(`/admin/loans?${params.toString()}`)
    }
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("status")
    params.delete("search")
    params.delete("page")
    setSearchValue("")
    router.push(`/admin/loans?${params.toString()}`)
  }

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("page")
    setSearchValue("")
    router.push(`/admin/loans?${params.toString()}`)
  }

  const clearStatusFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("status")
    params.delete("page")
    router.push(`/admin/loans?${params.toString()}`)
  }

  const hasActiveFilter = (currentStatus && currentStatus !== "all") || (currentSearch && currentSearch.trim())

  const statusOptions = [
    { value: "all", label: "Todos os status", color: "text-gray-600" },
    { value: "pending", label: "Pendente", color: "text-amber-600" },
    { value: "active", label: "Ativo", color: "text-blue-600" },
    { value: "returned", label: "Devolvido", color: "text-green-600" },
    { value: "overdue", label: "Atrasado", color: "text-red-600" },
    { value: "rejected", label: "Rejeitado", color: "text-red-600" },
  ]

  return (
    <div className="space-y-4">
      {/* Linha com busca + filtro */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Campo de busca */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por livro, aluno ou ID do empréstimo..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 h-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchValue("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filtro de status */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status do Empréstimo</label>
          <Select value={currentStatus || "all"} onValueChange={updateFilter}>
            <SelectTrigger className="w-48 h-10">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botão de limpar tudo */}
        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-10 px-3 text-sm mt-[22px]">
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar Tudo
          </Button>
        )}
      </div>

      {/* Badges de filtros ativos */}
      {hasActiveFilter && (
        <div className="flex flex-wrap gap-2">
          {currentSearch && currentSearch.trim() && (
            <Badge variant="secondary" className="gap-1">
              Busca: {currentSearch}
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={clearSearch}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {currentStatus && currentStatus !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find((opt) => opt.value === currentStatus)?.label}
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={clearStatusFilter}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
