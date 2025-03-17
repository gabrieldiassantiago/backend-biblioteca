// components/PaginationControls.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  statusFilter: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  statusFilter,
}: PaginationControlsProps) {
  const router = useRouter();

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const handlePrevious = () => {
    const newParams = new URLSearchParams({
      page: (currentPage - 1).toString(),
      ...(statusFilter !== "all" && { status: statusFilter }),
    });
    router.push(`/admin/loans?${newParams.toString()}`);
  };

  const handleNext = () => {
    const newParams = new URLSearchParams({
      page: (currentPage + 1).toString(),
      ...(statusFilter !== "all" && { status: statusFilter }),
    });
    router.push(`/admin/loans?${newParams.toString()}`);
  };

  return (
    <div className="flex items-center justify-between space-x-2 py-4 px-4 border-t">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!hasPreviousPage}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNextPage}
        >
          Próxima
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} (Total: {totalItems} empréstimos)
      </div>
    </div>
  );
}