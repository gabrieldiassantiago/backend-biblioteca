"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { PieChartIcon } from "lucide-react"

interface LoanStatusData {
  name: string
  value: number
  color: string
}

export function LoanStatusChart({ data, loading }: { data: LoanStatusData[]; loading: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [chartSize, setChartSize] = useState({
    innerRadius: 0, // Mudado para 0 para criar um gráfico de pizza sólido
    outerRadius: 110,
    fontSize: 16,
  })

  useEffect(() => {
    setMounted(true)
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 400) {
        setChartSize({ innerRadius: 0, outerRadius: 70, fontSize: 14 })
      } else if (width < 768) {
        setChartSize({ innerRadius: 0, outerRadius: 90, fontSize: 15 })
      } else {
        setChartSize({ innerRadius: 0, outerRadius: 110, fontSize: 16 })
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Cores mais distintas e contrastantes
  const COLORS = ["#4f46e5", "#10b981", "#ef4444", "#f59e0b", "#6366f1"]

  // Traduzir os nomes para português no gráfico
  const translatedData = data.map((entry, index) => ({
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
    color: COLORS[index % COLORS.length],
  }))

  // Renderizar a legenda personalizada para maior clareza
  const renderCustomLegend = () => {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        {translatedData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div className="h-5 w-5 mr-2" style={{ backgroundColor: entry.color, borderRadius: "4px" }} />
            <span className="text-base font-medium">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-bold">Status dos Empréstimos</CardTitle>
          </div>
        </div>
        <CardDescription className="text-base mt-1">Distribuição dos empréstimos por status</CardDescription>
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
                  paddingAngle={2}
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
                    border: "2px solid #333",
                    borderRadius: "8px",
                    fontSize: `${chartSize.fontSize}px`,
                    fontWeight: "bold",
                    padding: "10px",
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

