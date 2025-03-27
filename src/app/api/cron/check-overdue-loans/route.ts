// app/api/cron/check-overdue-loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from '@/app/lib/email-service';

// Definição dos tipos
interface OverdueLoan {
  id: string;
  status: string;
}

export async function POST(request: NextRequest) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Buscar empréstimos ativos OU já atrasados com data de devolução anterior à data atual
    const { data: overdueLoans, error } = await supabase
      .from("loans")
      .select("id, status")
      .in("status", ["active", "overdue"])  // Incluir tanto ativos quanto atrasados
      .lt("due_date", today)
      .is("returned_at", null);

    if (error) {
      console.error("Erro ao buscar empréstimos atrasados:", error);
      return NextResponse.json({ error: 'Falha ao buscar empréstimos' }, { status: 500 });
    }

    const loans = overdueLoans as OverdueLoan[];
    let processedCount = 0;
    let emailCount = 0;
    let statusUpdateCount = 0;
    let errorCount = 0;

    // Atualizar status e enviar emails
    for (const loan of loans) {
      try {
        // Atualizar status para "overdue" apenas se ainda estiver "active"
        if (loan.status === "active") {
          const { error: updateError } = await supabase
            .from("loans")
            .update({ status: "overdue" })
            .eq("id", loan.id);

          if (updateError) {
            console.error(`Erro ao atualizar empréstimo ${loan.id}:`, updateError);
            errorCount++;
            continue;
          }
          statusUpdateCount++;
        }

        // Enviar email de notificação em todos os casos
        await sendEmail(loan.id, "overdueLoan");
        emailCount++;
        processedCount++;
        
        console.log(`Empréstimo ${loan.id} processado: ${loan.status === 'active' ? 'status atualizado e ' : ''}email enviado`);
      } catch (err) {
        console.error(`Erro ao processar empréstimo ${loan.id}:`, err);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      statusUpdates: statusUpdateCount,
      emailsSent: emailCount,
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