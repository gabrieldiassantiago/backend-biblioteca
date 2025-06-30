"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Utility function to build URL with all parameters for loans
function buildLoansListUrl(params: { page?: number; status?: string }) {
  const searchParams = new URLSearchParams()

  if (params.page && params.page > 1) {
    searchParams.set("page", params.page.toString())
  }

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status)
  }

  const queryString = searchParams.toString()
  return `/admin/loans${queryString ? `?${queryString}` : ""}`
}

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  statusFilter: string
}

export function PaginationControls({ currentPage, totalPages, totalItems, statusFilter }: PaginationControlsProps) {
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
    return buildLoansListUrl({
      page,
      status: statusFilter,
    })
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-6 bg-gray-50/50 border-t">
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        Página {currentPage} de {totalPages} • Total: <strong>{totalItems}</strong> empréstimos
      </div>

      <div className="flex items-center gap-2 order-1 sm:order-2">
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
    </div>
  )
}
