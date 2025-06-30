import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { DashboardData, DashboardStats, PopularBook, RecentLoan } from '@/types/dashboard';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const libraryId = searchParams.get('libraryId');
    const reportType = searchParams.get('type') || 'full'; // tipos: full, books, loans
    const format = searchParams.get('format') || 'json'; // json ou pdf
    
    if (!libraryId) {
      return NextResponse.json({ error: 'ID da biblioteca é obrigatório' }, { status: 400 });
    }

    // Buscar informações da biblioteca
    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('*')
      .eq('id', libraryId)
      .single();

    if (libraryError || !library) {
      return NextResponse.json({ error: 'Biblioteca não encontrada' }, { status: 404 });
    }

    // Inicializar stats com valores padrão
    const baseStats: DashboardStats = {
      totalBooks: 0,
      booksTrend: 0,
      activeUsers: 0, 
      usersTrend: 0,
      activeLoans: 0,
      loansTrend: 0,
      monthlyVisits: 0,
      visitsTrend: 0
    };

    // Dados padrão para qualquer tipo de relatório
    const reportData: Partial<DashboardData> = {
      libraryName: library.name,
      stats: baseStats,
      monthlyLoans: [],
      loanStatus: [],
      popularBooks: [],
      recentLoans: []
    };

    // Buscar estatísticas de livros
    if (reportType === 'full' || reportType === 'books') {
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('library_id', libraryId);

      if (booksError) {
        return NextResponse.json({ error: 'Erro ao buscar livros' }, { status: 500 });
      }

      // Total de livros
      const totalBooks = books?.length || 0;

      // Livros populares (ordenados por menor disponibilidade relativa ao estoque)
      const popularBooks: PopularBook[] = books
        ?.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          loans: book.stock - book.available, // Estimativa de empréstimos
          available: book.available,
          stock: book.stock
        }))
        .sort((a, b) => (b.stock - b.available) / b.stock - (a.stock - a.available) / a.stock)
        .slice(0, 5) || [];

      // Atualizar os stats com informações de livros
      reportData.stats = {
        ...baseStats,
        ...reportData.stats,
        totalBooks,
      };

      reportData.popularBooks = popularBooks;
    }

    // Buscar estatísticas de empréstimos
    if (reportType === 'full' || reportType === 'loans') {
      // Buscar a contagem de empréstimos ativos (returned_at IS NULL)
      const { count: activeLoansCount, error: activeLoansError } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('library_id', libraryId)
        .is('returned_at', null);

      if (activeLoansError) {
        return NextResponse.json({ error: `Erro ao buscar contagem de empréstimos ativos: ${activeLoansError.message}` }, { status: 500 });
      }

      // Buscar os empréstimos ativos com detalhes
      const { data: activeLoans, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          books:book_id (title),
          users:user_id (full_name)
        `)
        .eq('library_id', libraryId)
        .is('returned_at', null) // Filtra apenas empréstimos ativos
        .order('created_at', { ascending: false })
        .limit(10);

      if (loansError) {
        return NextResponse.json({ error: `Erro na consulta de empréstimos ativos: ${loansError.message}` }, { status: 500 });
      }

      // Empréstimos recentes (apenas ativos)
      const recentLoans: RecentLoan[] = activeLoans?.map(loan => ({
        id: loan.id,
        book: loan.books?.title || 'Livro desconhecido',
        user: loan.users?.full_name || 'Usuário desconhecido',
        date: new Date(loan.created_at).toLocaleDateString('pt-BR'),
        dueDate: new Date(loan.due_date).toLocaleDateString('pt-BR'),
        status: new Date(loan.due_date) < new Date() ? 'Atrasado' : 'Emprestado' // Como returned_at é null, só pode ser Emprestado ou Atrasado
      })) || [];

      // Contagem de usuários ativos (com empréstimos ativos)
      const { count: activeUsers, error: activeUsersError } = await supabase
        .from('loans')
        .select('user_id', { count: 'exact', head: true })
        .eq('library_id', libraryId)
        .is('returned_at', null);

      if (activeUsersError) {
        return NextResponse.json({ error: `Erro ao contar usuários ativos: ${activeUsersError.message}` }, { status: 500 });
      }

      // Atualizar os stats com informações de empréstimos
      if (reportData.stats) {
        reportData.stats = {
          ...reportData.stats,
          activeLoans: activeLoansCount || 0,
          activeUsers: activeUsers || 0,
        };
      }

      reportData.recentLoans = recentLoans;
    }

    // Se o formato solicitado for PDF, gerar HTML formatado para impressão
    if (format === 'pdf') {
      try {
        // Gerar um HTML que será formatado como PDF pelo navegador
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório - ${reportData.libraryName || 'Biblioteca'}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    h1 {
      text-align: center;
      margin-bottom: 10px;
    }
    .date {
      text-align: center;
      color: #7f8c8d;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 20px;
    }
    .stat-box {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #3498db;
    }
    .stat-label {
      font-size: 14px;
      color: #7f8c8d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .status-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
    }
    .status-emprestado {
      background-color: #3498db;
      color: white;
    }
    .status-devolvido {
      background-color: #2ecc71;
      color: white;
    }
    .status-atrasado {
      background-color: #e74c3c;
      color: white;
    }
    @media print {
      body {
        padding: 0;
      }
      .report-container {
        box-shadow: none;
        border: none;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <h1>Relatório - ${reportData.libraryName || 'Biblioteca'}</h1>
    <div class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
    
    <div class="section">
      <h2>Estatísticas Gerais</h2>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value">${reportData.stats?.totalBooks || 0}</div>
          <div class="stat-label">Total de Livros</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${reportData.stats?.activeLoans || 0}</div>
          <div class="stat-label">Empréstimos Ativos</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${reportData.stats?.activeUsers || 0}</div>
          <div class="stat-label">Usuários Ativos</div>
        </div>
      </div>
    </div>
    
    ${reportData.popularBooks && reportData.popularBooks.length > 0 ? `
    <div class="section">
      <h2>Livros Mais Populares</h2>
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Autor</th>
            <th>Empréstimos</th>
            <th>Disponível</th>
            <th>Estoque</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.popularBooks.map(book => `
          <tr>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.loans}</td>
            <td>${book.available}</td>
            <td>${book.stock}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    ${reportData.recentLoans && reportData.recentLoans.length > 0 ? `
    <div class="section">
      <h2>Empréstimos Ativos</h2>
      <table>
        <thead>
          <tr>
            <th>Livro</th>
            <th>Usuário</th>
            <th>Data</th>
            <th>Devolução</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.recentLoans.map(loan => `
          <tr>
            <td>${loan.book}</td>
            <td>${loan.user}</td>
            <td>${loan.date}</td>
            <td>${loan.dueDate}</td>
            <td>
              <span class="status-tag status-${loan.status.toLowerCase() === 'emprestado' ? 'emprestado' : 'atrasado'}">
                ${loan.status}
              </span>
            </td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <div class="no-print" style="text-align: center; margin-top: 30px;">
      <button onclick="window.print()">Imprimir Relatório</button>
    </div>
  </div>
  <script>
    // Auto-print para quando aberto diretamente
    window.onload = function() {
      // Espera um momento para garantir que o CSS carregou
      setTimeout(function() {
        // Se estamos em uma nova janela/aba, imprimir automaticamente
        if (window.opener) {
          window.print();
        }
      }, 500);
    }
  </script>
</body>
</html>
        `;
        
        // Retornar o HTML com o tipo correto
        return new Response(htmlContent, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      } catch (pdfError) {
        console.error('Erro ao gerar relatório HTML:', pdfError);
        return NextResponse.json({ error: `Erro ao gerar relatório: ${pdfError instanceof Error ? pdfError.message : 'Erro desconhecido'}` }, { status: 500 });
      }
    }
    
    // Se não for PDF, retornar JSON como antes
    return NextResponse.json({
      success: true,
      data: reportData,
      generated_at: new Date().toISOString(),
      library_id: libraryId,
      report_type: reportType
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar relatório' }, { status: 500 });
  }
}

// Rota para gerar relatório em PDF (implementação básica)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { libraryId, reportType = 'full', format = 'pdf' } = body;
    
    if (!libraryId) {
      return NextResponse.json({ error: 'ID da biblioteca é obrigatório' }, { status: 400 });
    }

    // Redirecionamos para obter os mesmos dados da rota GET
    const reportUrl = new URL(request.url);
    reportUrl.searchParams.set('libraryId', libraryId);
    reportUrl.searchParams.set('type', reportType);
    reportUrl.searchParams.set('format', format);
    
    try {
      const reportResponse = await fetch(reportUrl.toString(), { method: 'GET' });
      
      // Se a resposta não foi bem-sucedida, tratar o erro
      if (!reportResponse.ok) {
        const errorData = await reportResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
        return NextResponse.json(errorData, { status: reportResponse.status });
      }
      
      // Se o formato for PDF (HTML na verdade), simplesmente passar o conteúdo
      if (format === 'pdf') {
        try {
          const htmlContent = await reportResponse.text();
          
          return new Response(htmlContent, {
            headers: {
              'Content-Type': 'text/html',
            },
          });
        } catch (htmlError) {
          console.error('Erro ao processar HTML:', htmlError);
          return NextResponse.json({ 
            error: `Erro ao processar relatório: ${htmlError instanceof Error ? htmlError.message : 'Erro desconhecido'}` 
          }, { status: 500 });
        }
      }
      
      // Se for JSON, processar normalmente
      const reportData = await reportResponse.json();
      return NextResponse.json(reportData);
      
    } catch (fetchError) {
      console.error('Erro ao buscar dados do relatório:', fetchError);
      return NextResponse.json({ 
        error: `Erro ao buscar dados do relatório: ${fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'}` 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Erro ao processar requisição de relatório:', error);
    return NextResponse.json({ 
      error: `Erro ao processar requisição de relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    }, { status: 500 });
  }
}