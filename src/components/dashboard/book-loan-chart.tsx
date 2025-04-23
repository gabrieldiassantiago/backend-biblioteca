// Garanta que este arquivo começa com a diretiva "use client"
"use client"

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Ajuste o caminho se necessário
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Skeleton } from "@/components/ui/skeleton"; // Ajuste o caminho se necessário
import { BarChart2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // Ajuste o caminho se necessário
import html2canvas from 'html2canvas';

// Definição da interface para os dados de empréstimo
interface MonthlyLoanData {
  name: string; // Nome do mês (ex: "Janeiro", "Fevereiro")
  emprestimos: number; // Número de empréstimos naquele mês
}

// Função auxiliar reutilizável para disparar o download de um arquivo
const downloadFile = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link); // Adiciona ao DOM (necessário para Firefox)
  link.click(); // Simula o clique para iniciar o download
  document.body.removeChild(link); // Remove o link do DOM após o clique
};

// Componente do Gráfico de Empréstimos por Mês
export function BookLoanChart({ data, loading }: { data: MonthlyLoanData[]; loading: boolean }) {
  const [mounted, setMounted] = useState(false); // Estado para verificar se o componente está montado no cliente
  const [fontSize, setFontSize] = useState(14); // Estado para ajustar o tamanho da fonte responsivamente
  const chartRef = useRef<HTMLDivElement>(null); // Referência para o elemento DOM que contém o gráfico (usado para exportar PNG)

  // Efeito para rodar após a montagem do componente no cliente e para lidar com redimensionamento da janela
  useEffect(() => {
    setMounted(true); // Confirma que o componente está montado no lado do cliente

    // Função para ajustar o tamanho da fonte com base na largura da janela
    const handleResize = () => {
      setFontSize(window.innerWidth < 640 ? 12 : 14);
    };

    handleResize(); // Define o tamanho inicial da fonte
    window.addEventListener("resize", handleResize); // Adiciona listener para redimensionamento

    // Função de limpeza: remove o listener quando o componente é desmontado
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Array de dependências vazio garante que o efeito rode apenas uma vez após a montagem

  // Simplifica os nomes dos meses para 3 letras (usado apenas para exibição no eixo X do gráfico)
  const simplifiedData = data.map((item) => ({
    ...item,
    name: item.name.substring(0, 3),
  }));

  // --- Funções de Exportação ---

  /**
   * Exporta o conteúdo do gráfico (delimitado pelo chartRef) como uma imagem PNG.
   */
  const handleExportPNG = async () => {
    // Verifica se a ref está anexada, se não está carregando e se está montado
    if (!chartRef.current || loading || !mounted) {
      console.error("Gráfico não está pronto para exportar ou não há dados.");
      // Idealmente, mostrar um feedback visual para o usuário (ex: toast/alert)
      return;
    }

    try {
      // Captura o elemento referenciado como um canvas usando html2canvas
      const canvas = await html2canvas(chartRef.current, {
          useCORS: true, // Permite capturar imagens de outras origens (se houver)
          logging: false, // Oculta os logs do html2canvas no console
          scale: 2,       // Aumenta a escala para melhor resolução (imagem 2x maior)
          backgroundColor: '#ffffff', // Define um fundo branco explícito para a imagem
      });
      // Converte o canvas para uma Data URL no formato PNG
      const image = canvas.toDataURL("image/png", 1.0); // 1.0 = qualidade máxima
      // Usa a função auxiliar para iniciar o download
      downloadFile(image, "grafico-emprestimos-por-mes.png");
    } catch (error) {
      console.error("Erro ao exportar gráfico para PNG:", error);
      // Mostrar feedback de erro para o usuário
    }
  };

  /**
   * Exporta os dados brutos do gráfico (nomes completos dos meses) como um arquivo CSV.
   */
  const handleExportCSV = () => {
    if (loading || !data || data.length === 0) {
       console.error("Não há dados para exportar ou os dados ainda estão carregando.");
       return;
    }

    const header = "Mês,Empréstimos\n";
    const csvRows = data.map(row =>
      `"${row.name.replace(/"/g, '""')}","${row.emprestimos}"`
    );
    const csvContent = header + csvRows.join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, "dados-emprestimos-por-mes.csv");
    URL.revokeObjectURL(url);
  };

  // --- Renderização JSX do Componente ---
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        {/* Cabeçalho com Título, Descrição e Menu Dropdown */}
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
          {/* Menu Dropdown com opções de exportação */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <MoreVertical className="h-4 w-4 text-gray-500" />
                <span className="sr-only">Menu de opções</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

      {/* Conteúdo do Card - Anexa a ref aqui para incluir gráfico e legenda na exportação PNG */}
      <CardContent ref={chartRef} className="pt-4">
        {/* Container do Gráfico */}
        <div className="h-[350px]">
          {loading ? (
            // Mostra Skeleton enquanto os dados estão carregando
            <div className="flex h-full w-full items-center justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
          ) : mounted ? (
            // Renderiza o gráfico apenas se o componente estiver montado no cliente
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simplifiedData} margin={{ top: 30, right: 30, left: 20, bottom: 40 }}>
                {/* Configurações do Gráfico Recharts */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name" // Usa os nomes simplificados dos meses
                  tick={{ fontSize: fontSize, fill: "#4b5563" }}
                  tickLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  axisLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  dy={10} // Deslocamento vertical dos ticks
                />
                <YAxis
                  tick={{ fontSize: fontSize, fill: "#4b5563" }}
                  tickLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  axisLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  width={40} // Largura reservada para o eixo Y
                />
                <Tooltip
                  cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }} // Fundo leve ao passar o mouse
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: `${fontSize}px`,
                    padding: "10px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [`${value} empréstimos`, null]} // Formata o valor no tooltip
                  labelStyle={{ fontWeight: "medium", marginBottom: "5px", color: "#1f2937" }} // Estilo do label (mês)
                />
                <Bar
                  dataKey="emprestimos"
                  fill="#4f46e5" // Cor das barras
                  radius={[4, 4, 0, 0]} // Bordas arredondadas no topo
                  barSize={40} // Largura das barras
                  animationDuration={1000} // Duração da animação
                >
                  {/* Mostra o valor no topo de cada barra */}
                  <LabelList
                    dataKey="emprestimos"
                    position="top"
                    fill="#4b5563" // Cor do texto da label
                    fontSize={fontSize}
                    fontWeight="medium"
                    dy={-5} // Deslocamento vertical da label
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            // Renderiza null se não estiver montado (evita erros de hidratação SSR)
            null
          )}
        </div>

        {/* Legenda personalizada abaixo do gráfico */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center bg-indigo-50 px-3 py-1.5 rounded-full">
            <div className="h-3 w-3 bg-indigo-600 rounded-sm mr-2"></div> {/* Quadrado de cor */}
            <span className="text-sm font-medium text-gray-700">Empréstimos mensais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}