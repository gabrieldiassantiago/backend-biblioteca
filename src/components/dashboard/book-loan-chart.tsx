"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen } from 'lucide-react'

interface MonthlyLoanData {
  name: string
  emprestimos: number
}

export function BookLoanChart({ data, loading }: { data: MonthlyLoanData[]; loading: boolean }) {
  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-card to-card/80 shadow-md transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Empréstimos por Mês</CardTitle>
          <CardDescription>Número total de empréstimos realizados por mês</CardDescription>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] md:h-[350px]">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.2} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // On small screens, abbreviate month names
                  return window.innerWidth < 400 ? value.substring(0, 3) : value
                }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value} empréstimos`, "Total"]}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
              />
              <Bar 
                dataKey="emprestimos" 
                fill="url(#barGradient)" 
                radius={[4, 4, 0, 0]} 
                name="Empréstimos"
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
