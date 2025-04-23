// Certifique-se que esta diretiva está no topo do arquivo
"use client"

import React, { useState, useEffect, useRef } from "react"; // Adicione useRef
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Ajuste o caminho se necessário
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton"; // Ajuste o caminho se necessário
import { PieChartIcon, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // Ajuste o caminho se necessário
import html2canvas from "html2canvas"; // Importe html2canvas

// Definição da interface para os dados de status
interface LoanStatusData {
  name: string; // Nome do status (ex: "Ativos", "Devolvidos")
  value: number; // Quantidade para esse status
  color: string; // Cor associada ao status
}

// Função auxiliar para download de arquivo (Corrigido: downloadFile)
const downloadFile = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function LoanStatusChart({ data, loading }: { data: LoanStatusData[]; loading: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [chartSize, setChartSize] = useState({
    innerRadius: 60,
    outerRadius: 110,
    fontSize: 16,
  });
  const chartRef = useRef<HTMLDivElement>(null); // Ref para o conteúdo do card (gráfico + legenda)

  // Efeito para montar e ajustar tamanho responsivo
  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 400) {
        setChartSize({ innerRadius: 40, outerRadius: 70, fontSize: 14 });
      } else if (width < 768) {
        setChartSize({ innerRadius: 50, outerRadius: 90, fontSize: 15 });
      } else {
        setChartSize({ innerRadius: 60, outerRadius: 110, fontSize: 16 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Os dados já vêm com nomes traduzidos, então usamos diretamente.
  // Se precisar de tradução dinâmica, mantenha o map.
  const chartData = data; // Ou use 'translatedData' se a tradução for necessária aqui

  // --- Funções de Exportação ---

  /**
   * Exporta o conteúdo do gráfico e legenda como uma imagem PNG.
   */
  const handleExportPNG = async () => {
    if (!chartRef.current || loading || !mounted || data.length === 0) {
      console.error("Gráfico não está pronto para exportar, carregando ou sem dados.");
      // Adicionar feedback visual (toast/alert) seria bom
      return;
    }

    try {
      const canvas = await html2canvas(chartRef.current, {
          useCORS: true,
          logging: false,
          scale: 2,
          backgroundColor: '#ffffff', // Garante fundo branco
      });
      const image = canvas.toDataURL("image/png", 1.0);
      downloadFile(image, "grafico-status-emprestimos.png");
    } catch (error) {
      console.error("Erro ao exportar gráfico para PNG:", error);
      // Adicionar feedback de erro
    }
  };

  /**
   * Exporta os dados do gráfico como um arquivo CSV.
   */
  const handleExportCSV = () => {
    if (loading || !data || data.length === 0) {
       console.error("Não há dados para exportar ou ainda estão carregando.");
       // Adicionar feedback visual
       return;
    }

    // Cabeçalho do CSV (incluindo a cor, opcionalmente)
    const header = "Status,Quantidade,Cor\n";
    // Mapeia os dados para linhas CSV, tratando aspas
    const csvRows = data.map(row =>
      `"${row.name.replace(/"/g, '""')}","${row.value}","${row.color}"`
    );
    const csvContent = header + csvRows.join("\n");

    // Cria e baixa o arquivo Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, "dados-status-emprestimos.csv");
    URL.revokeObjectURL(url); // Libera memória
  };


  // Renderizar a legenda personalizada
  const renderCustomLegend = () => {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-6 pt-4 border-t border-gray-100">
        {chartData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div className="h-3 w-3 mr-2 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-600 truncate"> {/* truncate para nomes longos */}
              {entry.name}: <span className="font-semibold text-gray-800">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  // --- Renderização JSX ---
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* CardHeader com Dropdown */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* Título e Descrição */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <PieChartIcon className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">Status dos Empréstimos</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Distribuição dos empréstimos por status
              </CardDescription>
            </div>
          </div>
          {/* Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <MoreVertical className="h-4 w-4 text-gray-500" />
                <span className="sr-only">Menu de opções</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Itens do Menu com onSelect */}
              <DropdownMenuItem onSelect={handleExportPNG}>
                Exportar como PNG
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExportCSV}>
                Exportar como CSV
              </DropdownMenuItem>
              {/* <DropdownMenuItem disabled>Ver em tela cheia</DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* CardContent com a ref para exportação PNG */}
      <CardContent ref={chartRef} className="pt-4">
        {/* Container do Gráfico */}
        <div className="h-[280px] sm:h-[300px]"> {/* Altura ajustada */}
          {loading ? (
            // Skeleton durante o carregamento
            <div className="flex h-full w-full items-center justify-center">
              <Skeleton className="h-40 w-40 sm:h-48 sm:w-48 rounded-full" />
            </div>
          ) : data.length === 0 ? (
            // Mensagem se não houver dados
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-500">
              Nenhum dado disponível para exibir.
            </div>
          ) : mounted ? (
            // Gráfico renderizado após montar
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={chartSize.innerRadius}
                  outerRadius={chartSize.outerRadius}
                  paddingAngle={4} // Espaço entre as fatias
                  dataKey="value"
                  // Label opcional dentro da fatia (mostra se for > 5%)
                  label={({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : "")}
                  labelLine={false} // Não mostra a linha para a label
                  animationDuration={1000}
                  animationBegin={200}
                  stroke="#fff" // Borda branca entre fatias
                  strokeWidth={2}
                >
                  {/* Mapeia os dados para criar as células coloridas da pizza */}
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none hover:opacity-80 transition-opacity"/>
                  ))}
                </Pie>
                {/* Tooltip customizado */}
                <Tooltip
                  cursor={{fill: 'rgba(200, 200, 200, 0.2)'}} // Fundo leve ao passar o mouse sobre a fatia
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: `${chartSize.fontSize-1}px`, // Fonte um pouco menor no tooltip
                    padding: "8px 12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                  formatter={(value: number, name: string) => [`${value} empréstimos`, name]} // Formato: Valor e Nome
                  labelStyle={{ fontWeight: "500", marginBottom: "4px", color: "#374151" }} // Estilo do nome (label)
                  itemStyle={{ padding: '0', margin: '0', color: '#4b5563'}} // Estilo do valor
                />
              </PieChart>
            </ResponsiveContainer>
          ) : null /* Renderiza null se não estiver montado */}
        </div>

        {/* Legenda personalizada renderizada condicionalmente */}
        {!loading && mounted && data.length > 0 && renderCustomLegend()}

      </CardContent>
    </Card>
  );
}