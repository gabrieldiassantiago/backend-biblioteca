"use client"

import React from "react"
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
    "text-blue-600",
    "text-emerald-600",
    "text-amber-600",
    "text-rose-600",
  ]

  const isTrendUp = stat.trend.startsWith("+")

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-bold">{stat.title}</CardTitle>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ${iconColors[index % iconColors.length]}`}>
          <stat.icon className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-bold">{stat.value}</div>
        )}
        <div className="mt-2 flex items-center text-sm">
          {loading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <div className={`flex items-center rounded-full px-3 py-1 text-sm font-bold ${
              isTrendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>
              {isTrendUp ? (
                <ArrowUpRight className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4" />
              )}
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
