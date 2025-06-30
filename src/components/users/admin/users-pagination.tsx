"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Utility function to build URL with all parameters for users
function buildUsersListUrl(params: { page?: number; search?: string; grade?: string; sort?: string }) {
  const searchParams = new URLSearchParams()

  if (params.page && params.page > 1) {
    searchParams.set("page", params.page.toString())
  }

  if (params.search) {
    searchParams.set("search", params.search)
  }

  if (params.grade) {
    searchParams.set("grade", params.grade)
  }

  if (params.sort && params.sort !== "newest") {
    searchParams.set("sort", params.sort)
  }

  const queryString = searchParams.toString()
  return `/admin/users${queryString ? `?${queryString}` : ""}`
}

interface UsersPaginationProps {
  currentPage: number
  totalPages: number
  search?: string
  grade?: string
  sort?: string
}

export function UsersPagination({ currentPage, totalPages, search, grade, sort }: UsersPaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const pageNumbers = getPageNumbers()

  const buildPageUrl = (page: number) => {
    return buildUsersListUrl({
      page,
      search,
      grade,
      sort,
    })
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-8 border-t">
      {/* Previous Button */}
      <Button variant="outline" size="sm" asChild disabled={currentPage <= 1} className="h-10 px-4">
        <Link href={buildPageUrl(Math.max(1, currentPage - 1))} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Link>
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === "...") {
            return (
              <div key={`dots-${index}`} className="px-2">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            )
          }

          const page = pageNum as number
          const isActive = page === currentPage

          return (
            <Button key={page} variant={isActive ? "default" : "outline"} size="sm" asChild className="h-10 w-10">
              <Link href={buildPageUrl(page)}>{page}</Link>
            </Button>
          )
        })}
      </div>

      {/* Next Button */}
      <Button variant="outline" size="sm" asChild disabled={currentPage >= totalPages} className="h-10 px-4">
        <Link href={buildPageUrl(Math.min(totalPages, currentPage + 1))} className="flex items-center gap-2">
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
