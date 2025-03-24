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
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333333;
          background-color: #f5f5f5;
          font-size: 16px;
          line-height: 1.6;
        }
        
        h1, h2, h3, h4, h5, h6 {
          margin-top: 0;
          font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        p {
          margin: 0 0 16px;
        }
        
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        
        .header {
          padding: 30px 0;
          text-align: center;
          background-color: #2563eb;
          color: #ffffff;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .content {
          padding: 40px;
        }
        
        .footer {
          padding: 20px;
          text-align: center;
          background-color: #f0f0f0;
          font-size: 14px;
          color: #666666;
        }
        
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          background-color: #f9f9f9;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e0e0e0;
        }
        
        .info-table td {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 16px;
        }
        
        .info-table tr:last-child td {
          border-bottom: none;
        }
        
        .label {
          font-weight: 700;
          width: 40%;
          color: #4b5563;
        }
        
        .alert-box {
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          font-size: 16px;
        }
        
        .signature {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
          font-size: 16px;
        }
        
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 700;
          margin: 16px 0;
          text-align: center;
        }
        
        .logo {
          margin-bottom: 16px;
        }
        
        .divider {
          height: 1px;
          background-color: #e0e0e0;
          margin: 24px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <svg class="logo" width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h1>Biblioteca ${loan.library_name}</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
          ${content}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Este é um email automático, por favor não responda.</p>
          <p style="margin-top: 8px;">© ${new Date().getFullYear()} Biblioteca ${loan.library_name}. Todos os direitos reservados.</p>
        </div>
      </div>
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
  updateLoan: (loan: Loan) => { subject: string; html: string }
} = {
  newLoan: (loan: Loan) => {
    const content = `
      <h2 style="color: #2563eb; font-size: 24px; margin-bottom: 24px; border-bottom: 2px solid #e0e0e0; padding-bottom: 12px;">
        Novo Empréstimo Registrado
      </h2>
      
      <p style="font-size: 18px; margin-bottom: 16px;">
        Olá <strong>${loan.users.full_name}</strong>,
      </p>
      
      <p style="font-size: 18px; margin-bottom: 24px;">
        Um novo empréstimo foi registrado em seu nome na biblioteca ${loan.library_name}:
      </p>
      
      <table class="info-table">
        <tr>
          <td class="label">Livro:</td>
          <td style="font-size: 18px;"><strong>${loan.books.title}</strong></td>
        </tr>
        <tr>
          <td class="label">Data do empréstimo:</td>
          <td>${formatDate(loan.borrowed_at)}</td>
        </tr>
        <tr>
          <td class="label">Data de devolução:</td>
          <td><strong style="color: #2563eb; font-size: 18px;">${formatDate(loan.due_date)}</strong></td>
        </tr>
      </table>
      
      <div class="alert-box" style="background-color: #dbeafe; border-left: 4px solid #2563eb;">
        <p style="margin: 0; color: #1e40af;">
          <strong>Lembrete:</strong> Por favor, devolva o livro até a data de vencimento para evitar atrasos e possíveis penalidades.
        </p>
      </div>
      
      <a href="#" class="button">
        Ver Detalhes do Empréstimo
      </a>
      
      <div class="signature">
        <p>Agradecemos por utilizar nossos serviços!</p>
        <p style="margin-top: 16px;">
          Atenciosamente,<br>
          <strong>Equipe Biblioteca ${loan.library_name}</strong>
        </p>
      </div>
    `

    return {
      subject: `Novo Empréstimo Registrado - ${loan.library_name}`,
      html: getBaseTemplate(content, loan),
    }
  },

  overdueLoan: (loan: Loan) => {
    const content = `
      <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 24px; border-bottom: 2px solid #e0e0e0; padding-bottom: 12px;">
        Empréstimo Atrasado
      </h2>
      
      <p style="font-size: 18px; margin-bottom: 16px;">
        Olá <strong>${loan.users.full_name}</strong>,
      </p>
      
      <p style="font-size: 18px; margin-bottom: 24px;">
        O seguinte empréstimo está <strong style="color: #dc2626;">atrasado</strong> na biblioteca ${loan.library_name}:
      </p>
      
      <table class="info-table">
        <tr>
          <td class="label">Livro:</td>
          <td style="font-size: 18px;"><strong>${loan.books.title}</strong></td>
        </tr>
        <tr>
          <td class="label">Data de devolução prevista:</td>
          <td><strong style="color: #dc2626; font-size: 18px;">${formatDate(loan.due_date)}</strong></td>
        </tr>
      </table>
      
      <div class="alert-box" style="background-color: #fee2e2; border-left: 4px solid #dc2626;">
        <p style="margin: 0; color: #b91c1c;">
          <strong>Atenção:</strong> Por favor, devolva o livro o mais rápido possível para evitar penalidades adicionais.
        </p>
      </div>
      
      <a href="#" class="button" style="background-color: #dc2626;">
        Regularizar Empréstimo
      </a>
      
      <div class="signature">
        <p>Caso já tenha devolvido o livro, por favor desconsidere este email.</p>
        <p style="margin-top: 16px;">
          Atenciosamente,<br>
          <strong>Equipe Biblioteca ${loan.library_name}</strong>
        </p>
      </div>
    `

    return {
      subject: `URGENTE: Empréstimo Atrasado - ${loan.library_name}`,
      html: getBaseTemplate(content, loan),
    }
  },

  rejectedLoan: (loan: Loan) => {
    const content = `
      <h2 style="color: #6b7280; font-size: 24px; margin-bottom: 24px; border-bottom: 2px solid #e0e0e0; padding-bottom: 12px;">
        Empréstimo Rejeitado
      </h2>
      
      <p style="font-size: 18px; margin-bottom: 16px;">
        Olá <strong>${loan.users.full_name}</strong>,
      </p>
      
      <p style="font-size: 18px; margin-bottom: 24px;">
        Seu pedido de empréstimo foi rejeitado na biblioteca ${loan.library_name}:
      </p>
      
      <table class="info-table">
        <tr>
          <td class="label">Livro:</td>
          <td style="font-size: 18px;"><strong>${loan.books.title}</strong></td>
        </tr>
        <tr>
          <td class="label">Motivo:</td>
          <td>Estoque indisponível ou limite de empréstimos excedido</td>
        </tr>
      </table>
      
      <div class="alert-box" style="background-color: #f3f4f6; border-left: 4px solid #6b7280;">
        <p style="margin: 0; color: #4b5563;">
          <strong>Informação:</strong> Entre em contato com a biblioteca para mais informações ou para verificar a disponibilidade de outros títulos.
        </p>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: #4b5563; font-size: 20px; margin-bottom: 16px;">Outras opções disponíveis</h3>
      
      <p style="margin-bottom: 24px;">
        Você pode verificar outros títulos similares disponíveis em nosso acervo:
      </p>
      
      <a href="#" class="button" style="background-color: #6b7280;">
        Explorar Catálogo
      </a>
      
      <div class="signature">
        <p style="margin-top: 16px;">
          Atenciosamente,<br>
          <strong>Equipe Biblioteca ${loan.library_name}</strong>
        </p>
      </div>
    `

    return {
      subject: `Empréstimo Rejeitado - ${loan.library_name}`,
      html: getBaseTemplate(content, loan),
    }
  },


  updateLoan: (loan: Loan) => {
    const content = `
      <h2 style="color: #2563eb; font-size: 24px; margin-bottom: 24px; border-bottom: 2px solid #e0e0e0; padding-bottom: 12px;">
        Data de Devolução Atualizada
      </h2>
      
      <p style="font-size: 18px; margin-bottom: 16px;">
        Olá <strong>${loan.users.full_name}</strong>,
      </p>
      
      <p style="font-size: 18px; margin-bottom: 24px;">
        A data de devolução do seu empréstimo na biblioteca ${loan.library_name} foi atualizada:
      </p>
      
      <table class="info-table">
        <tr>
          <td class="label">Livro:</td>
          <td style="font-size: 18px;"><strong>${loan.books.title}</strong></td>
        </tr>
        <tr>
          <td class="label">Data de empréstimo:</td>
          <td>${formatDate(loan.borrowed_at)}</td>
        </tr>
        <tr>
          <td class="label">Nova data de devolução:</td>
          <td><strong style="color: #2563eb; font-size: 18px;">${formatDate(loan.due_date)}</strong></td>
        </tr>
      </table>
      
      <div class="alert-box" style="background-color: #dbeafe; border-left: 4px solid #2563eb;">
        <p style="margin: 0; color: #1e40af;">
          <strong>Lembrete:</strong> Por favor, devolva o livro até a nova data de vencimento para evitar atrasos.
        </p>
      </div>
      
      <a href="#" class="button">
        Ver Detalhes do Empréstimo
      </a>
      
      <div class="signature">
        <p>Se precisar de mais informações, entre em contato conosco!</p>
        <p style="margin-top: 16px;">
          Atenciosamente,<br>
          <strong>Equipe Biblioteca ${loan.library_name}</strong>
        </p>
      </div>
    `
  
    return {
      subject: `Data de Devolução Atualizada - ${loan.library_name}`,
      html: getBaseTemplate(content, loan),
    }
  },



  returnedLoan: (loan: Loan) => {
    const content = `
      <h2 style="color: #16a34a; font-size: 24px; margin-bottom: 24px; border-bottom: 2px solid #e0e0e0; padding-bottom: 12px;">
        Empréstimo Devolvido
      </h2>
      
      <p style="font-size: 18px; margin-bottom: 16px;">
        Olá <strong>${loan.users.full_name}</strong>,
      </p>
      
      <p style="font-size: 18px; margin-bottom: 24px;">
        O seguinte empréstimo foi marcado como <strong style="color: #16a34a;">devolvido</strong> na biblioteca ${loan.library_name}:
      </p>
      
      <table class="info-table">
        <tr>
          <td class="label">Livro:</td>
          <td style="font-size: 18px;"><strong>${loan.books.title}</strong></td>
        </tr>
        <tr>
          <td class="label">Data de devolução:</td>
          <td><strong style="color: #16a34a; font-size: 18px;">${formatDate(loan.returned_at || new Date().toISOString())}</strong></td>
        </tr>
      </table>
      
      <div class="alert-box" style="background-color: #dcfce7; border-left: 4px solid #16a34a;">
        <p style="margin: 0; color: #166534;">
          <strong>Obrigado!</strong> Agradecemos por utilizar nossa biblioteca e por devolver o livro.
        </p>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: #16a34a; font-size: 20px; margin-bottom: 16px;">Recomendações para você</h3>
      
      <p style="margin-bottom: 24px;">
        Com base em seus interesses, você pode gostar de outros títulos em nosso acervo:
      </p>
      
      <a href="#" class="button" style="background-color: #16a34a;">
        Ver Recomendações
      </a>
      
      <div class="signature">
        <p>Esperamos vê-lo novamente em breve!</p>
        <p style="margin-top: 16px;">
          Atenciosamente,<br>
          <strong>Equipe Biblioteca ${loan.library_name}</strong>
        </p>
      </div>
    `

    return {
      subject: `Empréstimo Devolvido - ${loan.library_name}`,
      html: getBaseTemplate(content, loan),
    }
  },
}

export async function sendEmail(loanId: string, type: "newLoan" | "overdueLoan" | "rejectedLoan" | "returnedLoan" | "updateLoan") {
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