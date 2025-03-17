"use server"

import nodemailer from "nodemailer"
import { createClient } from "@/lib/supabase/server"

// Definir tipos para as estruturas de dados
interface Book {
  title: string
}

interface User {
  full_name: string
  email: string
}

interface Loan {
  id: string
  user_id: string
  book_id: string
  library_id: string
  library_name: string
  borrowed_at: string
  due_date: string
  returned_at: string | null
  status: "pending" | "active" | "returned" | "overdue" | "rejected"
  books: Book
  users: User
}

// Configuração do transporte de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Função para obter detalhes do empréstimo
async function getLoanDetails(loanId: string): Promise<Loan> {
  const supabase = await createClient()

  // Define the expected shape of the query result
  interface QueryResult {
    id: string
    user_id: string
    book_id: string
    library_id: string
    borrowed_at: string
    due_date: string
    returned_at: string | null
    status: "pending" | "active" | "returned" | "overdue" | "rejected"
    books: { title: string }
    users: { full_name: string; email: string }
    libraries: { name: string }
  }

  const { data: loan, error } = (await supabase
    .from("loans")
    .select(`
      id,
      user_id,
      book_id,
      library_id,
      borrowed_at,
      due_date,
      returned_at,
      status,
      books!inner(title),
      users!inner(full_name, email),
      libraries!inner(name)
    `)
    .eq("id", loanId)
    .single()) as { data: QueryResult | null; error: Error }

  if (error || !loan) {
    throw new Error("Erro ao obter detalhes do empréstimo: " + (error?.message || "Dados não encontrados"))
  }

  // Mapear os dados retornados para o tipo Loan
  const formattedLoan: Loan = {
    id: loan.id,
    user_id: loan.user_id,
    book_id: loan.book_id,
    library_id: loan.library_id,
    library_name: loan.libraries.name,
    borrowed_at: loan.borrowed_at,
    due_date: loan.due_date,
    returned_at: loan.returned_at,
    status: loan.status,
    books: {
      title: loan.books.title,
    },
    users: {
      full_name: loan.users.full_name,
      email: loan.users.email,
    },
  }

  return formattedLoan
}

// Função para formatar data
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Template base para todos os emails
function getBaseTemplate(content: string, loan: Loan): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Biblioteca ${loan.library_name}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; background-color: #f5f5f5;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; margin: 20px auto; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="padding: 30px 0; text-align: center; background-color: #1a3d66; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Biblioteca ${loan.library_name}</h1>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 30px 40px;">
            ${content}
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #f0f0f0; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 14px; color: #666666;">
            <p style="margin: 0;">Este é um email automático, por favor não responda.</p>
            <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Biblioteca ${loan.library_name}. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// Templates de email
const templates: {
  newLoan: (loan: Loan) => { subject: string; html: string }
  overdueLoan: (loan: Loan) => { subject: string; html: string }
  rejectedLoan: (loan: Loan) => { subject: string; html: string }
  returnedLoan: (loan: Loan) => { subject: string; html: string }
} = {
  newLoan: (loan: Loan) => {
    const content = `
      <h2 style="color: #1a3d66; margin-top: 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Novo Empréstimo Registrado</h2>
      
      <p style="font-size: 16px; line-height: 1.5;">Olá <strong>${loan.users.full_name}</strong>,</p>
      
      <p style="font-size: 16px; line-height: 1.5;">Um novo empréstimo foi registrado em seu nome na biblioteca ${loan.library_name}:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9; border-radius: 6px;">
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 40%;">Livro:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${loan.books.title}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Data do empréstimo:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${formatDate(loan.borrowed_at)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; font-weight: bold;">Data de devolução:</td>
          <td style="padding: 12px 15px;"><strong style="color: #e63946;">${formatDate(loan.due_date)}</strong></td>
        </tr>
      </table>
      
      <div style="background-color: #e8f4f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 15px;">Por favor, devolva o livro até a data de vencimento para evitar atrasos e possíveis penalidades.</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5; margin-top: 25px;">Agradecemos por utilizar nossos serviços!</p>
      
      <p style="font-size: 16px; line-height: 1.5;">
        Atenciosamente,<br>
        <strong>Equipe Biblioteca ${loan.library_name}</strong>
      </p>
    `

    return {
      subject: `Novo Empréstimo Registrado - ${loan.library_name}`,
      html: getBaseTemplate(content, loan),
    }
  },

  overdueLoan: (loan: Loan) => {
    const content = `
      <h2 style="color: #e63946; margin-top: 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Empréstimo Atrasado</h2>
      
      <p style="font-size: 16px; line-height: 1.5;">Olá <strong>${loan.users.full_name}</strong>,</p>
      
      <p style="font-size: 16px; line-height: 1.5;">O seguinte empréstimo está <strong style="color: #e63946;">atrasado</strong> na biblioteca ${loan.library_name}:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9; border-radius: 6px;">
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 40%;">Livro:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${loan.books.title}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; font-weight: bold;">Data de devolução prevista:</td>
          <td style="padding: 12px 15px;"><strong style="color: #e63946;">${formatDate(loan.due_date)}</strong></td>
        </tr>
      </table>
      
      <div style="background-color: #fae5e7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e63946;">
        <p style="margin: 0; font-size: 15px; color: #d32f2f;"><strong>Atenção:</strong> Por favor, devolva o livro o mais rápido possível para evitar penalidades adicionais.</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5; margin-top: 25px;">Caso já tenha devolvido o livro, por favor desconsidere este email.</p>
      
      <p style="font-size: 16px; line-height: 1.5;">
        Atenciosamente,<br>
        <strong>Equipe Biblioteca ${loan.library_name}</strong>
      </p>
    `

    return {
      subject: `URGENTE: Empréstimo Atrasado - ${loan.library_name}`,
      html: getBaseTemplate(content, loan),
    }
  },

  rejectedLoan: (loan: Loan) => {
    const content = `
      <h2 style="color: #6c757d; margin-top: 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Empréstimo Rejeitado</h2>
      
      <p style="font-size: 16px; line-height: 1.5;">Olá <strong>${loan.users.full_name}</strong>,</p>
      
      <p style="font-size: 16px; line-height: 1.5;">Seu pedido de empréstimo foi rejeitado na biblioteca ${loan.library_name}:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9; border-radius: 6px;">
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 40%;">Livro:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${loan.books.title}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; font-weight: bold;">Motivo:</td>
          <td style="padding: 12px 15px;">Estoque indisponível ou limite de empréstimos excedido</td>
        </tr>
      </table>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6c757d;">
        <p style="margin: 0; font-size: 15px;">Entre em contato com a biblioteca para mais informações ou para verificar a disponibilidade de outros títulos.</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5;">
        Atenciosamente,<br>
        <strong>Equipe Biblioteca ${loan.library_name}</strong>
      </p>
    `

    return {
      subject: `Empréstimo Rejeitado - ${loan.library_name}`,
      html: getBaseTemplate(content, loan),
    }
  },

  returnedLoan: (loan: Loan) => {
    const content = `
      <h2 style="color: #2e7d32; margin-top: 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Empréstimo Devolvido</h2>
      
      <p style="font-size: 16px; line-height: 1.5;">Olá <strong>${loan.users.full_name}</strong>,</p>
      
      <p style="font-size: 16px; line-height: 1.5;">O seguinte empréstimo foi marcado como <strong style="color: #2e7d32;">devolvido</strong> na biblioteca ${loan.library_name}:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9; border-radius: 6px;">
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 40%;">Livro:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${loan.books.title}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; font-weight: bold;">Data de devolução:</td>
          <td style="padding: 12px 15px;"><strong style="color: #2e7d32;">${formatDate(loan.returned_at || new Date().toISOString())}</strong></td>
        </tr>
      </table>
      
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2e7d32;">
        <p style="margin: 0; font-size: 15px;">Obrigado por utilizar nossa biblioteca! Esperamos vê-lo novamente em breve.</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5;">
        Atenciosamente,<br>
        <strong>Equipe Biblioteca ${loan.library_name}</strong>
      </p>
    `

    return {
      subject: `Empréstimo Devolvido - ${loan.library_name}`,
      html: getBaseTemplate(content, loan),
    }
  },
}

export async function sendEmail(loanId: string, type: "newLoan" | "overdueLoan" | "rejectedLoan" | "returnedLoan") {
  try {
    const loan = await getLoanDetails(loanId)

    if (!loan.users.email) {
      console.error(`Usuário ${loan.users.full_name} não tem email cadastrado`)
      return
    }

    const template = templates[type](loan)

    await transporter.sendMail({
      from: `"Biblioteca ${loan.library_name}" <${process.env.EMAIL_FROM}>`,
      to: loan.users.email,
      subject: template.subject,
      html: template.html,
    })

    console.log(`Email enviado com sucesso: ${type} para ${loan.users.email}`)
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    throw new Error("Falha ao enviar email")
  }
}

