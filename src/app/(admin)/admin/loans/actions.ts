// src/app/(admin)/admin/loans/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Função para obter o library_id do usuário autenticado
async function getUserLibraryId() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('library_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.library_id) {
    throw new Error("Usuário não está vinculado a uma biblioteca");
  }

  return userData.library_id;
}

// Server Action para atualizar o status do empréstimo
export async function updateLoanStatus(loanId: string, newStatus: "active" | "returned" | "overdue") {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();

  const { data: loan, error: fetchError } = await supabase
    .from("loans")
    .select("library_id, status")
    .eq("id", loanId)
    .single();

  if (fetchError || !loan) {
    throw new Error("Empréstimo não encontrado");
  }
  if (loan.library_id !== libraryId) {
    throw new Error("Você não tem permissão para atualizar este empréstimo");
  }
  if (loan.status === newStatus) {
    throw new Error(`Este empréstimo já está como "${newStatus}"`);
  }

  const updateData: { status: string; returned_at?: string | null; updated_at: string } = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === "returned") {
    updateData.returned_at = new Date().toISOString();
  } else {
    updateData.returned_at = null;
  }

  const { error: updateError } = await supabase
    .from("loans")
    .update(updateData)
    .eq("id", loanId);

  if (updateError) {
    console.error("Erro ao atualizar empréstimo:", updateError.message);
    throw new Error("Erro ao atualizar status do empréstimo");
  }

  revalidatePath("/admin/loans");
}