"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface MonthlyLoanData {
  name: string
  emprestimos: number
}

export function BookLoanChart({ data, loading }: { data: MonthlyLoanData[]; loading: boolean }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Empréstimos por Mês</CardTitle>
        <CardDescription>Número total de empréstimos realizados por mês</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] md:h-[350px]">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // On small screens, abbreviate month names
                  return window.innerWidth < 400 ? value.substring(0, 3) : value
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value} empréstimos`, "Total"]}
              />
              <Bar dataKey="emprestimos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Empréstimos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
