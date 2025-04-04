"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart2, MoreVertical } from "lucide-react"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
        setFontSize(12)
      } else {
        setFontSize(14)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Simplificar os nomes dos meses para versões de 3 letras
  const simplifiedData = data.map((item) => ({
    ...item,
    name: item.name.substring(0, 3),
  }))

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <BarChart2 className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">Empréstimos por Mês</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Número total de empréstimos realizados por mês
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <MoreVertical className="h-4 w-4 text-gray-500" />
                <span className="sr-only">Menu de opções</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Exportar como PNG</DropdownMenuItem>
              <DropdownMenuItem>Exportar como CSV</DropdownMenuItem>
              <DropdownMenuItem>Ver em tela cheia</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[350px]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
          ) : mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simplifiedData} margin={{ top: 30, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: fontSize, fill: "#4b5563" }}
                  tickLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  axisLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: fontSize, fill: "#4b5563" }}
                  tickLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  axisLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: `${fontSize}px`,
                    padding: "10px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [`${value} empréstimos`, "Total"]}
                  labelStyle={{ fontWeight: "medium", marginBottom: "5px" }}
                />
                <Bar dataKey="emprestimos" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1000}>
                  <LabelList
                    dataKey="emprestimos"
                    position="top"
                    fill="#4b5563"
                    fontSize={fontSize}
                    fontWeight="medium"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        {/* Legenda simplificada */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center bg-indigo-50 px-3 py-1.5 rounded-full">
            <div className="h-3 w-6 bg-indigo-700 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700">Empréstimos mensais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

