"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";


interface LoanStatusData {
  name: string;
  value: number;
  color: string; // This will be mapped to chart config colors
}

interface ReportsLoanStatusChartProps {
  data: LoanStatusData[];
  loading: boolean;
}

// Define the chartConfig based on your data names
const chartConfig = {
  ativos: {
    label: "Ativos",
    color: "hsl(var(--chart-1))", // Using Shadcn chart colors
  },
  devolvidos: {
    label: "Devolvidos",
    color: "hsl(var(--chart-2))",
  },
  atrasados: {
    label: "Atrasados",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function ReportsLoanStatusChart({
  data,
  loading,
}: ReportsLoanStatusChartProps) {
  // Map your data to match chartConfig keys for colors
  const mappedData = data.map(item => {
    let key: keyof typeof chartConfig;
    switch (item.name) {
      case "Ativos": key = "ativos"; break;
      case "Devolvidos": key = "devolvidos"; break;
      case "Atrasados": key = "atrasados"; break;
      default: key = "ativos"; // Fallback
    }
    return {
      name: item.name,
      value: item.value,
      fill: `var(--color-${key})` // Use the CSS variable for fill
    };
  });

  if (loading) {
    return (
      <Card className="shadow-sm h-[380px] flex flex-col">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-[380px]">
      <CardHeader>
        <CardTitle>Status dos Empréstimos</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <PieChart>
            <Pie
              data={mappedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90} // Slightly larger for better visual
              paddingAngle={5}
              dataKey="value"
              nameKey="name" // Use 'name' for the legend and tooltip label
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {mappedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill} // Use the fill prop from mappedData
                  stroke={entry.fill} // Add stroke for consistency
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}