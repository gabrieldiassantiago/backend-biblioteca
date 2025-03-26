// app/api/cron/check-overdue-loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from '@/app/lib/email-service';

// Definição dos tipos
interface OverdueLoan {
  id: string;
}

export async function POST(request: NextRequest) {
  // Verificar se a requisição veio do sistema de cron do Vercel
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Buscar empréstimos ativos com data de devolução anterior à data atual
    const { data: overdueLoans, error } = await supabase
      .from("loans")
      .select("id")
      .eq("status", "active")
      .lt("due_date", today)
      .is("returned_at", null);

    if (error) {
      console.error("Erro ao buscar empréstimos atrasados:", error);
      return NextResponse.json({ error: 'Falha ao buscar empréstimos' }, { status: 500 });
    }

    const loans = overdueLoans as OverdueLoan[];
    let processedCount = 0;
    let errorCount = 0;

    // Atualizar status e enviar emails
    for (const loan of loans) {
      try {
        // Atualizar status para "overdue"
        const { error: updateError } = await supabase
          .from("loans")
          .update({ status: "overdue" })
          .eq("id", loan.id);

        if (updateError) {
          console.error(`Erro ao atualizar empréstimo ${loan.id}:`, updateError);
          errorCount++;
          continue;
        }

        // Enviar email de notificação
        await sendEmail(loan.id, "overdueLoan");
        processedCount++;
        
        console.log(`Empréstimo ${loan.id} marcado como atrasado e email enviado`);
      } catch (err) {
        console.error(`Erro ao processar empréstimo ${loan.id}:`, err);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      total: loans.length
    });
  } catch (error) {
    console.error("Erro geral na verificação de empréstimos:", error);
    return NextResponse.json({ error: 'Falha interna do servidor' }, { status: 500 });
  }
}

// Também podemos permitir a execução via GET para testes
export async function GET(request: NextRequest) {
  // Reutilizar a mesma lógica de autorização
  return POST(request);
}