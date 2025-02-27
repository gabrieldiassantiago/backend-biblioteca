"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Dados fictícios para demonstração
const data = [
  { name: "Jan", emprestimos: 65 },
  { name: "Fev", emprestimos: 59 },
  { name: "Mar", emprestimos: 80 },
  { name: "Abr", emprestimos: 81 },
  { name: "Mai", emprestimos: 56 },
  { name: "Jun", emprestimos: 55 },
  { name: "Jul", emprestimos: 40 },
]

export function BookLoanChart() {
  return (
    <Card className="w-full">
    <CardHeader>
      <CardTitle>Empréstimos por Mês</CardTitle>
      <CardDescription>
        Número total de empréstimos realizados por mês
      </CardDescription>
    </CardHeader>
    <CardContent className="h-[300px] sm:h-[350px]">
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
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
            }}
            formatter={(value) => [`${value} empréstimos`, "Total"]}
          />
          <Bar 
            dataKey="emprestimos" 
            fill="hsl(var(--chart-1))" 
            radius={[4, 4, 0, 0]} 
            name="Empréstimos"
          />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
  )
}