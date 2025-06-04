"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChartIcon, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface LoanStatusData {
  name: string
  value: number
  color: string
}

export function LoanStatusChart({
  data,
  loading,
}: {
  data: LoanStatusData[]
  loading: boolean
}) {
  const [, setMounted] = useState(false)
  const [, setChartSize] = useState({
    innerRadius: 60,
    outerRadius: 110,
    fontSize: 16,
  })
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 400) {
        setChartSize({ innerRadius: 40, outerRadius: 70, fontSize: 14 })
      } else if (width < 768) {
        setChartSize({ innerRadius: 50, outerRadius: 90, fontSize: 15 })
      } else {
        setChartSize({ innerRadius: 60, outerRadius: 110, fontSize: 16 })
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Função customizada para renderizar a legenda
  const renderLegend = (props: { payload?: Array<{ value: string; color?: string }> }) => {
    const { payload } = props
    if (!payload) return null

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || "#8884d8" }} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-violet-50 dark:bg-violet-900 p-2">
              <PieChartIcon className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Status dos Empréstimos</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Distribuição por status</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Exportar PNG</DropdownMenuItem>
              <DropdownMenuItem>Exportar CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent ref={chartRef} className="pt-4">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={110}
                labelLine={false}
                label={({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : "")}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, "Quantidade"]}
                labelStyle={{ color: "#374151" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
