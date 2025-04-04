"use client"

import React from "react"
import { ArrowUpRight, ArrowDownRight, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DashboardStat {
  title: string
  value: string
  icon: React.ElementType
  trend: string
}

interface StatCardProps {
  stat: DashboardStat
  loading: boolean
  index: number
}

export const StatCard: React.FC<StatCardProps> = React.memo(({ stat, loading, index }) => {
  const iconColors = [
    "text-indigo-700 bg-indigo-100",
    "text-emerald-700 bg-emerald-100",
    "text-amber-700 bg-amber-100",
    "text-rose-700 bg-rose-100",
  ]

  const isTrendUp = stat.trend.startsWith("+")

  return (
    <Card className="border border-gray-200 shadow-sm overflow-hidden relative hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconColors[index % iconColors.length]}`}
          >
            <stat.icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <MoreVertical className="h-4 w-4 text-gray-500" />
              <span className="sr-only">Menu de opções</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem>Exportar dados</DropdownMenuItem>
            <DropdownMenuItem>Configurar alerta</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-24" />
        ) : (
          <div className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</div>
        )}
        <div className="mt-3 flex items-center text-sm">
          {loading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <div
              className={`flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                isTrendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {isTrendUp ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
              <span>{stat.trend}</span>
              <span className="ml-1">vs. mês anterior</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

StatCard.displayName = "StatCard"

