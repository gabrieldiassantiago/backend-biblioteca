"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface MonthlyLoanData {
  name: string;
  emprestimos: number;
}

export function BookLoanChart({ data, loading }: { data: MonthlyLoanData[]; loading: boolean }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Empréstimos por Mês</CardTitle>
        <CardDescription>Número total de empréstimos realizados por mês</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[350px]">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-32 w-32 animate-pulse rounded-full bg-muted"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
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