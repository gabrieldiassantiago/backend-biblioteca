"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";


interface MonthlyLoanData {
  name: string; // e.g., "Jan", "Fev"
  emprestimos: number;
}

interface ReportsMonthlyLoansChartProps {
  data: MonthlyLoanData[];
  loading: boolean;
}

// Define the chartConfig for your bar chart
const chartConfig = {
  emprestimos: {
    label: "Empréstimos",
    color: "hsl(var(--chart-4))", // Use another Shadcn chart color
  },
} satisfies ChartConfig;

export function ReportsMonthlyLoansChart({
  data,
  loading,
}: ReportsMonthlyLoansChartProps) {
  if (loading) {
    return (
      <Card className="shadow-sm h-[380px] flex flex-col">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-[380px]">
      <CardHeader>
        <CardTitle>Empréstimos por Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-xs" // Smaller text for axis
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} /> {/* Hide label for cleaner tooltip */}
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="emprestimos"
              fill="var(--color-emprestimos)" // Use the CSS variable from chartConfig
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}