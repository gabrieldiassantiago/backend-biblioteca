// src/app/(admin)/admin/books/dashboard-actions.ts
"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserLibraryId } from "../loans/actions"; // ajuste se estiver noutro caminho

/* ---------- utilitário ---------- */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/* ---------- tipos brutos vindos da RPC ---------- */
interface RawStats {
  totalBooks: number;
  newBooks: number;
  lastMonthBooks: number;
  totalUsers: number;
  newUsers: number;
  lastMonthUsers: number;
  activeLoans: number;
  newLoans: number;
  lastMonthLoans: number;
}

interface RawDashboardData {
  stats: RawStats;
  monthlyLoans: { name: string; emprestimos: number }[];
  loanStatus: { name: string; value: number; color: string }[];
  popularBooks: {
    id: string;
    title: string;
    author: string;
    loans: number;
    available: number;
    stock: number;
  }[];
  recentLoans: {
    id: string;
    book: string;
    user: string;
    date: string;
    dueDate: string;
    status: string;
  }[];
  libraryName: string;
}

/* ---------- tipos finais ---------- */
export interface Stats {
  totalBooks: number;
  booksTrend: number;
  totalUsers: number;
  usersTrend: number;
  activeLoans: number;
  loansTrend: number;
  monthlyVisits: number;
  visitsTrend: number;
}

export interface MonthlyLoanData {
  name: string;
  emprestimos: number;
}
export interface LoanStatusData {
  name: string;
  value: number;
  color: string;
}
export interface PopularBook {
  id: string;
  title: string;
  author: string;
  loans: number;
  available: number;
  stock: number;
}
export interface RecentLoan {
  id: string;
  book: string;
  user: string;
  date: string;
  dueDate: string;
  status: string;
}

export interface DashboardData {
  stats: Stats;
  monthlyLoans: MonthlyLoanData[];
  loanStatus: LoanStatusData[];
  popularBooks: PopularBook[];
  recentLoans: RecentLoan[];
  libraryName: string;
}

/* ---------- função principal ----------
   Se `classFilter` estiver definido (ex.: "6º Ano - Fundamental"),
   ele é enviado como p_class para a RPC.                */
export const getAllDashboardData = cache(
  async (classFilter?: string): Promise<DashboardData> => {
    const libraryId = await getUserLibraryId();
    const supabase = await createClient();

    const rpcArgs: { p_library_id: string; p_class?: string } = {
      p_library_id: libraryId,
    };
    if (classFilter) rpcArgs.p_class = classFilter;

    const { data: raw, error } = await supabase
      .rpc("get_complete_dashboard_data", rpcArgs)
      .single();

    if (error) {
      console.error("RPC get_complete_dashboard_data:", error);
      throw new Error(error.message);
    }

    const rd = raw as RawDashboardData;
    const s = rd.stats;

    // visitas (placeholder aleatório)
    const monthlyVisits = Math.floor(Math.random() * 10000);
    const lastMonthVisits = Math.floor(Math.random() * 9000) + 4000;

    const stats: Stats = {
      totalBooks: s.totalBooks,
      booksTrend: calculateTrend(s.newBooks, s.lastMonthBooks),
      totalUsers: s.totalUsers,
      usersTrend: calculateTrend(s.newUsers, s.lastMonthUsers),
      activeLoans: s.activeLoans,
      loansTrend: calculateTrend(s.newLoans, s.lastMonthLoans),
      monthlyVisits,
      visitsTrend: calculateTrend(monthlyVisits, lastMonthVisits),
    };

    return {
      stats,
      monthlyLoans: rd.monthlyLoans,
      loanStatus: rd.loanStatus,
      popularBooks: rd.popularBooks,
      recentLoans: rd.recentLoans,
      libraryName: rd.libraryName,
    };
  },
);
