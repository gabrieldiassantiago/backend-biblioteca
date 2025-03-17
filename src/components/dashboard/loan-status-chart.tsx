"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { PieChartIcon } from 'lucide-react'

interface LoanStatusData {
  name: string
  value: number
  color: string
}

export function LoanStatusChart({ data, loading }: { data: LoanStatusData[]; loading: boolean }) {
  const [chartSize, setChartSize] = useState({
    innerRadius: 60,
    outerRadius: 90,
    fontSize: 12,
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 400) {
        setChartSize({ innerRadius: 40, outerRadius: 60, fontSize: 10 })
      } else if (width < 768) {
        setChartSize({ innerRadius: 50, outerRadius: 75, fontSize: 11 })
      } else {
        setChartSize({ innerRadius: 60, outerRadius: 90, fontSize: 12 })
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

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-card to-card/80 shadow-md transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Status dos Empréstimos</CardTitle>
          <CardDescription>Distribuição dos empréstimos por status</CardDescription>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <PieChartIcon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] md:h-[350px]">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        ) : (
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
                label={({ name, percent }) => (percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : "")}
                labelLine={false}
                animationDuration={1500}
                animationBegin={200}
              >
                {translatedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="hsl(var(--background))" 
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  fontSize: `${chartSize.fontSize}px`,
                }}
                formatter={(value: number, name: string) => [`${value} empréstimos`, name]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: `${chartSize.fontSize}px` }}
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
