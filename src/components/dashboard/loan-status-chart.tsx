"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Status dos Empréstimos</CardTitle>
        <CardDescription>Distribuição dos empréstimos por status</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] md:h-[350px]">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={chartSize.innerRadius}
                outerRadius={chartSize.outerRadius}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                  fontSize: `${chartSize.fontSize}px`,
                }}
                formatter={(value: number) => [`${value} empréstimos`, ""]}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: `${chartSize.fontSize}px` }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
