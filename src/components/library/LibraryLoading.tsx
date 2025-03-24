import { Skeleton } from "@/components/ui/skeleton"
import { Search } from 'lucide-react'

export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar skeleton */}
        <div className="max-w-2xl mx-auto mb-12 relative z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-indigo-600/5 rounded-2xl transform -rotate-1 scale-[1.03] blur-sm"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Skeleton className="w-full h-14 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-0 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
              <div className="p-6 pt-3 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
              <div className="p-6 pt-0">
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
