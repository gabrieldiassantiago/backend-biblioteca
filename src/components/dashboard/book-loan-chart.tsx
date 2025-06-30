"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart2, MoreVertical, Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import html2canvas from "html2canvas"

// Definição da interface para os dados de empréstimo
interface MonthlyLoanData {
  name: string
  emprestimos: number
}

// Função auxiliar reutilizável para disparar o download de um arquivo
const downloadFile = (url: string, filename: string) => {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Componente do Gráfico de Empréstimos por Mês
export function BookLoanChart({ data, loading }: { data: MonthlyLoanData[]; loading: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const handleResize = () => {
      setFontSize(window.innerWidth < 640 ? 12 : 14)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const simplifiedData = data.map((item) => ({
    ...item,
    name: item.name.substring(0, 3),
  }))

  const handleExportPNG = async () => {
    if (!chartRef.current || loading || !mounted) {
      console.error("Gráfico não está pronto para exportar ou não há dados.")
      return
    }

    try {
      const canvas = await html2canvas(chartRef.current, {
        useCORS: true,
        logging: false,
        scale: 2,
        backgroundColor: "#ffffff",
      })
      const image = canvas.toDataURL("image/png", 1.0)
      downloadFile(image, "grafico-emprestimos-por-mes.png")
    } catch (error) {
      console.error("Erro ao exportar gráfico para PNG:", error)
    }
  }

  const handleExportCSV = () => {
    if (loading || !data || data.length === 0) {
      console.error("Não há dados para exportar ou os dados ainda estão carregando.")
      return
    }

    const header = "Mês,Empréstimos\n"
    const csvRows = data.map((row) => `"${row.name.replace(/"/g, '""')}","${row.emprestimos}"`)
    const csvContent = header + csvRows.join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    downloadFile(url, "dados-emprestimos-por-mes.csv")
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-violet-50 p-2">
              <BarChart2 className="h-5 w-5 text-violet-600" />
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
              <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu de opções</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleExportPNG} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar como PNG
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar como CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent ref={chartRef} className="pt-4">
        <div className="h-[350px]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
          ) : mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simplifiedData} margin={{ top: 30, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: fontSize, fill: "#64748b" }}
                  tickLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                  axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: fontSize, fill: "#64748b" }}
                  tickLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                  axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: `${fontSize}px`,
                    padding: "10px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [`${value} empréstimos`, null]}
                  labelStyle={{ fontWeight: "medium", marginBottom: "5px", color: "#334155" }}
                />
                <Bar dataKey="emprestimos" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1000}>
                  <LabelList
                    dataKey="emprestimos"
                    position="top"
                    fill="#64748b"
                    fontSize={fontSize}
                    fontWeight="medium"
                    dy={-5}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        <div className="mt-4 flex justify-center">
          <div className="flex items-center bg-violet-50 px-3 py-1.5 rounded-full">
            <div className="h-3 w-3 bg-violet-500 rounded-sm mr-2"></div>
            <span className="text-sm font-medium text-gray-700">Empréstimos mensais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
