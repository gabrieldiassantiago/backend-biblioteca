"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

// Dados fictícios para demonstração
const data = [
  { name: "Ativos", value: 65, color: "hsl(var(--chart-2))" },
  { name: "Devolvidos", value: 120, color: "hsl(var(--chart-1))" },
  { name: "Atrasados", value: 15, color: "hsl(var(--chart-3))" },
]

export function LoanStatusChart() {
  return (
    <Card className="w-full">
    <CardHeader>
      <CardTitle>Status dos Empréstimos</CardTitle>
      <CardDescription>
        Distribuição dos empréstimos por status
      </CardDescription>
    </CardHeader>
    <CardContent className="h-[300px] sm:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
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
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
            }}
            formatter={(value) => [`${value} empréstimos`, ""]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
  )
}