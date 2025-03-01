"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface LoanStatusData {
  name: string;
  value: number;
  color: string;
}

export function LoanStatusChart({ data, loading }: { data: LoanStatusData[]; loading: boolean }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Status dos Empréstimos</CardTitle>
        <CardDescription>Distribuição dos empréstimos por status</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[350px]">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-32 w-32 animate-pulse rounded-full bg-muted"></div>
          </div>
        ) : (
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
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number) => [`${value} empréstimos`, ""]}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}