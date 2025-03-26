// /api/cron/check-overdue-loans.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from '@/app/lib/email-service';

// Definição dos tipos
interface OverdueLoan {
  id: string;
}

interface ResponseData {
  success: boolean;
  processed: number;
  errors: number;
  total: number;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ResponseData | { error: string }>
): Promise<void> {
  // Verificar se a requisição veio do sistema de cron do Vercel
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Não autorizado' });
    return;
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
      res.status(500).json({ error: 'Falha ao buscar empréstimos' });
      return;
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

    res.status(200).json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      total: loans.length
    });
  } catch (error) {
    console.error("Erro geral na verificação de empréstimos:", error);
    res.status(500).json({ error: 'Falha interna do servidor' });
  }
}