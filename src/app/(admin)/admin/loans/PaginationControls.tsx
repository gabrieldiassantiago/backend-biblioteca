"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  statusFilter: string
}

export function PaginationControls({ currentPage, totalPages, totalItems, statusFilter }: PaginationControlsProps) {
  const router = useRouter()

  const hasPreviousPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  const handlePrevious = () => {
    const newParams = new URLSearchParams({
      page: (currentPage - 1).toString(),
      ...(statusFilter !== "all" && { status: statusFilter }),
    })
    router.push(`/admin/loans?${newParams.toString()}`)
  }

  const handleNext = () => {
    const newParams = new URLSearchParams({
      page: (currentPage + 1).toString(),
      ...(statusFilter !== "all" && { status: statusFilter }),
    })
    router.push(`/admin/loans?${newParams.toString()}`)
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)

      // Calculate start and end of page range
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning
      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1)
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push("ellipsis-start")
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis-end")
      }

      // Always include last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  const handlePageClick = (page: number) => {
    if (page === currentPage) return

    const newParams = new URLSearchParams({
      page: page.toString(),
      ...(statusFilter !== "all" && { status: statusFilter }),
    })
    router.push(`/admin/loans?${newParams.toString()}`)
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6">
      <div className="text-sm text-gray-500 order-2 sm:order-1">
        Página {currentPage} de {totalPages} (Total: {totalItems} empréstimos)
      </div>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={!hasPreviousPage}
          className="h-8 w-8 rounded-md border-gray-200"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((page, index) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <div key={`ellipsis-${index}`} className="px-2 flex items-center justify-center">
                <span className="text-gray-500">...</span>
              </div>
            )
          }

          return (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageClick(page as number)}
              className={`h-8 w-8 p-0 font-medium ${
                currentPage === page ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {page}
            </Button>
          )
        })}

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={!hasNextPage}
          className="h-8 w-8 rounded-md border-gray-200"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
