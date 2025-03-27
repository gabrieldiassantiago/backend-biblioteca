// app/api/cron/check-overdue-loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from '@/app/lib/email-service';


export async function POST(request: NextRequest) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Primeiro, buscar e atualizar empréstimos ativos que estão atrasados
    const { data: newOverdueLoans, error: newOverdueError } = await supabase
      .from("loans")
      .select("id")
      .eq("status", "active")
      .lt("due_date", today)
      .is("returned_at", null);

    if (newOverdueError) {
      console.error("Erro ao buscar novos empréstimos atrasados:", newOverdueError);
      return NextResponse.json({ error: 'Falha ao buscar empréstimos' }, { status: 500 });
    }

    // Atualizar status dos novos empréstimos atrasados
    let newOverdueCount = 0;
    for (const loan of newOverdueLoans || []) {
      const { error: updateError } = await supabase
        .from("loans")
        .update({ status: "overdue" })
        .eq("id", loan.id);

      if (updateError) {
        console.error(`Erro ao atualizar empréstimo ${loan.id}:`, updateError);
        continue;
      }
      newOverdueCount++;
      console.log(`Empréstimo ${loan.id} marcado como atrasado`);
    }

    // Agora, buscar TODOS os empréstimos atrasados para enviar emails
    const { data: allOverdueLoans, error: allOverdueError } = await supabase
      .from("loans")
      .select("id")
      .eq("status", "overdue")
      .is("returned_at", null);

    if (allOverdueError) {
      console.error("Erro ao buscar todos os empréstimos atrasados:", allOverdueError);
      return NextResponse.json({ error: 'Falha ao buscar empréstimos atrasados' }, { status: 500 });
    }

    // Enviar emails para todos os empréstimos atrasados
    let emailsSent = 0;
    let emailErrors = 0;
    
    for (const loan of allOverdueLoans || []) {
      try {
        // Enviar email de notificação
        await sendEmail(loan.id, "overdueLoan");
        emailsSent++;
        console.log(`Email de atraso enviado para o empréstimo ${loan.id}`);
      } catch (err) {
        console.error(`Erro ao enviar email para empréstimo ${loan.id}:`, err);
        emailErrors++;
      }
    }

    return NextResponse.json({
      success: true,
      newOverdueLoans: newOverdueCount,
      totalOverdueLoans: (allOverdueLoans || []).length,
      emailsSent: emailsSent,
      emailErrors: emailErrors
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