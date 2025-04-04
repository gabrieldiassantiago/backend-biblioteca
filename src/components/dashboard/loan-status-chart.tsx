"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { PieChartIcon, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface LoanStatusData {
  name: string
  value: number
  color: string
}

export function LoanStatusChart({ data, loading }: { data: LoanStatusData[]; loading: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [chartSize, setChartSize] = useState({
    innerRadius: 60,
    outerRadius: 110,
    fontSize: 16,
  })

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

  // Traduzir os nomes para português no gráfico
  const translatedData = data.map((entry) => ({
    ...entry,
    name:
      entry.name === "Ativos"
        ? "Ativos"
        : entry.name === "Devolvidos"
          ? "Devolvidos"
          : entry.name === "Atrasados"
            ? "Atrasados"
            : entry.name === "Pendentes"
              ? "Pendentes"
              : entry.name === "Rejeitados"
                ? "Rejeitados"
                : entry.name,
  }))

  // Renderizar a legenda personalizada para maior clareza
  const renderCustomLegend = () => {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
        {translatedData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div className="h-4 w-4 mr-2 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-700">
              {entry.name}: <span className="font-medium">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <PieChartIcon className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">Status dos Empréstimos</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Distribuição dos empréstimos por status
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <MoreVertical className="h-4 w-4 text-gray-500" />
                <span className="sr-only">Menu de opções</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Exportar como PNG</DropdownMenuItem>
              <DropdownMenuItem>Exportar como CSV</DropdownMenuItem>
              <DropdownMenuItem>Ver em tela cheia</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[300px]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-xl font-medium">
              Nenhum dado disponível
            </div>
          ) : mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={translatedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={chartSize.innerRadius}
                  outerRadius={chartSize.outerRadius}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : "")}
                  labelLine={false}
                  animationDuration={1000}
                  animationBegin={200}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {translatedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: `${chartSize.fontSize}px`,
                    padding: "10px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number, name: string) => [`${value} empréstimos`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        {/* Legenda personalizada mais clara */}
        {!loading && mounted && data.length > 0 && renderCustomLegend()}
      </CardContent>
    </Card>
  )
}

