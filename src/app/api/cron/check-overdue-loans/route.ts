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
    
    console.log(`Executando verificação de empréstimos atrasados em ${today}`);
    
    // Parte 1: Atualizar empréstimos ativos que estão atrasados
    const { data: activeLateLoans, error: activeError } = await supabase
      .from("loans")
      .select("id, status, due_date")
      .eq("status", "active")
      .lt("due_date", today)
      .is("returned_at", null);
      
    if (activeError) {
      console.error("Erro ao buscar empréstimos ativos atrasados:", activeError);
      return NextResponse.json({ error: 'Falha ao buscar empréstimos ativos' }, { status: 500 });
    }
    
    console.log(`Encontrados ${activeLateLoans?.length || 0} empréstimos ativos que estão atrasados`);
    
    // Atualizar status dos empréstimos ativos que estão atrasados
    let statusUpdated = 0;
    let statusErrors = 0;
    
    for (const loan of activeLateLoans || []) {
      try {
        const { error: updateError } = await supabase
          .from("loans")
          .update({ status: "overdue" })
          .eq("id", loan.id);
          
        if (updateError) {
          console.error(`Erro ao atualizar status do empréstimo ${loan.id}:`, updateError);
          statusErrors++;
          continue;
        }
        
        statusUpdated++;
        console.log(`Empréstimo ${loan.id} atualizado de "active" para "overdue"`);
      } catch (err) {
        console.error(`Erro ao processar atualização do empréstimo ${loan.id}:`, err);
        statusErrors++;
      }
    }
    
    // Parte 2: Buscar TODOS os empréstimos atrasados (incluindo os que acabamos de atualizar)
    const { data: allOverdueLoans, error: overdueError } = await supabase
      .from("loans")
      .select("id, status, due_date")
      .eq("status", "overdue")
      .is("returned_at", null);
      
    if (overdueError) {
      console.error("Erro ao buscar todos os empréstimos atrasados:", overdueError);
      return NextResponse.json({ 
        error: 'Falha ao buscar empréstimos atrasados',
        statusUpdates: { success: statusUpdated, errors: statusErrors } 
      }, { status: 500 });
    }
    
    console.log(`Encontrados ${allOverdueLoans?.length || 0} empréstimos com status "overdue"`);
    
    // Enviar emails para todos os empréstimos com status "overdue"
    let emailsSent = 0;
    let emailErrors = 0;
    
    for (const loan of allOverdueLoans || []) {
      try {
        await sendEmail(loan.id, "overdueLoan");
        emailsSent++;
        console.log(`Email de lembrete enviado para empréstimo ${loan.id} (vencido em ${loan.due_date})`);
      } catch (err) {
        console.error(`Erro ao enviar email para empréstimo ${loan.id}:`, err);
        emailErrors++;
      }
    }
    
    // Retornar resultados detalhados
    return NextResponse.json({
      success: true,
      statusUpdates: {
        processed: statusUpdated,
        errors: statusErrors,
        total: activeLateLoans?.length || 0
      },
      emailNotifications: {
        sent: emailsSent,
        errors: emailErrors,
        total: allOverdueLoans?.length || 0
      },
      date: today
    });
    
  } catch (error) {
    console.error("Erro geral na verificação de empréstimos:", error);
    return NextResponse.json({ error: 'Falha interna do servidor' }, { status: 500 });
  }
}

// Também podemos permitir a execução via GET para testes
export async function GET(request: NextRequest) {
  return POST(request);
}