import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function BookListSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-0">
              {/* Cover Skeleton */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                <Skeleton className="w-full h-full" />
                <div className="absolute top-3 right-3">
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>

              {/* Info Skeleton */}
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center gap-4 pt-8 border-t">
        <Skeleton className="h-10 w-20" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10" />
          ))}
        </div>
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}
