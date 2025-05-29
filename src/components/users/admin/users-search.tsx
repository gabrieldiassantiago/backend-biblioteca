"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/app/hooks/useDebounce"

interface UsersSearchProps {
  defaultValue?: string
}

export function UsersSearch({ defaultValue = "" }: UsersSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(defaultValue)
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const currentSearch = params.get("search") || ""

    // Only update URL if search actually changed
    if (debouncedSearch !== currentSearch) {
      if (debouncedSearch) {
        params.set("search", debouncedSearch)
      } else {
        params.delete("search")
      }

      // Only reset to page 1 when search changes
      params.delete("page")
      router.push(`/admin/users?${params.toString()}`)
    }
  }, [debouncedSearch, router, searchParams])

  const clearSearch = () => {
    setSearch("")
  }

  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10 pr-10 h-11 bg-background border-gray-200 focus:border-primary transition-all duration-200"
      />
      {search && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSearch}
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
