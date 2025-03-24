"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen } from 'lucide-react'
import { useState, useEffect } from "react"

interface MonthlyLoanData {
  name: string
  emprestimos: number
}

export function BookLoanChart({ data, loading }: { data: MonthlyLoanData[]; loading: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  
  useEffect(() => {
    setMounted(true)
    
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setFontSize(12);
      } else {
        setFontSize(14);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [])

  // Simplificar os nomes dos meses para versões de 3 letras
  const simplifiedData = data.map(item => ({
    ...item,
    name: item.name.substring(0, 3)
  }));

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-bold">Empréstimos por Mês</CardTitle>
          </div>
        </div>
        <CardDescription className="text-base mt-1">
          Número total de empréstimos realizados por mês
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[350px]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
          ) : mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={simplifiedData} 
                margin={{ top: 30, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                <XAxis 
                  dataKey="name"
                  tick={{ fontSize: fontSize, fontWeight: 'bold' }}
                  tickLine={{ stroke: '#333', strokeWidth: 2 }}
                  axisLine={{ stroke: '#333', strokeWidth: 2 }}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: fontSize, fontWeight: 'bold' }}
                  tickLine={{ stroke: '#333', strokeWidth: 2 }}
                  axisLine={{ stroke: '#333', strokeWidth: 2 }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid #333",
                    borderRadius: "8px",
                    fontSize: `${fontSize}px`,
                    fontWeight: "bold",
                    padding: "10px"
                  }}
                  formatter={(value: number) => [`${value} empréstimos`, "Total"]}
                  labelStyle={{ fontWeight: "bold", marginBottom: "5px" }}
                />
                <Bar
                  dataKey="emprestimos"
                  fill="#4f46e5"
                  radius={[8, 8, 0, 0]}
                  barSize={50}
                >
                  <LabelList 
                    dataKey="emprestimos" 
                    position="top" 
                    fill="#333" 
                    fontSize={fontSize} 
                    fontWeight="bold"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
        
        {/* Legenda simplificada */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center">
            <div className="h-4 w-8 bg-[#4f46e5] rounded mr-2"></div>
            <span className="text-base font-medium">Empréstimos mensais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
