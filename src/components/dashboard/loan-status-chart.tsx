"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChartIcon, MoreVertical, Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import html2canvas from "html2canvas"

interface LoanStatusData {
  name: string
  value: number
  color: string
}

function downloadFile(contentUrl: string, filename: string) {
  const link = document.createElement("a")
  link.href = contentUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function LoanStatusChart({
  data,
  loading,
}: {
  data: LoanStatusData[]
  loading: boolean
}) {
  const [mounted, setMounted] = useState(false)
  const [chartSize, setChartSize] = useState({
    innerRadius: 60,
    outerRadius: 110,
    fontSize: 16,
  })
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 400) {
        setChartSize({ innerRadius: 40, outerRadius: 70, fontSize: 14 })
      } else if (width < 768) {
        setChartSize({ innerRadius: 50, outerRadius: 90, fontSize: 15 })
      } else {
        setChartSize({ innerRadius: 60, outerRadius: 110, fontSize: 16 })
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const timeStamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")

  const handleExportPNG = async () => {
    if (!chartRef.current || loading || data.length === 0) return
    try {
      const canvas = await html2canvas(chartRef.current, {
        useCORS: true,
        logging: false,
        scale: 3,
        backgroundColor: "#ffffff",
        windowWidth: chartRef.current.scrollWidth,
      })
      const image = canvas.toDataURL("image/png", 1.0)
      downloadFile(image, `grafico-status-emprestimos-${timeStamp()}.png`)
    } catch (err) {
      console.error("Falha ao exportar PNG", err)
    }
  }

  const handleExportCSV = () => {
    if (loading || data.length === 0) return

    const total = data.reduce((sum, d) => sum + d.value, 0)
    const header = ["Status", "Quantidade", "Percentual"].join(";") + "\n"

    const rows = data.map((d) => {
      const pct = total ? ((d.value / total) * 100).toFixed(2) : "0.00"
      return [d.name, d.value, `${pct.replace(".", ",")}%`].join(";")
    })

    const csvContent = "\uFEFF" + header + rows.join("\n")
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    downloadFile(url, `dados-status-emprestimos-${timeStamp()}.csv`)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-0 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-violet-50 p-2">
              <PieChartIcon className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Status dos Empréstimos</CardTitle>
              <CardDescription className="text-xs text-gray-500">Distribuição por status</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Opções</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleExportPNG} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar PNG
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent ref={chartRef} className="pt-4">
        <div className="h-[280px] sm:h-[300px]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Skeleton className="h-40 w-40 rounded-full sm:h-48 sm:w-48" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-500">
              Nenhum dado disponível.
            </div>
          ) : mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={chartSize.innerRadius}
                  outerRadius={chartSize.outerRadius}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : "")}
                  labelLine={false}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} className="transition-opacity hover:opacity-80" />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: "rgba(200,200,200,0.15)" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: `${chartSize.fontSize - 1}px`,
                    padding: "8px 12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                  formatter={(value: number, name: string) => [`${value} empréstimos`, name]}
                  labelStyle={{ fontWeight: 500, marginBottom: 4 }}
                  itemStyle={{ padding: 0, margin: 0 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        {mounted && !loading && data.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-4 text-sm">
            {data.map((entry, idx) => (
              <div key={idx} className="flex items-center">
                <span className="mr-2 h-3 w-3 flex-shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="truncate text-gray-500">
                  {entry.name}: <span className="font-medium text-gray-700">{entry.value}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
