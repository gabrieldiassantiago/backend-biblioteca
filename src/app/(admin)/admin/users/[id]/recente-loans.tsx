import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookOpen, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from "next/link";

interface Book {
  id: string;
  title: string;
  author: string;
}

interface Loan {
  id: string;
  borrowed_at: string;
  returned_at: string | null;
  due_date: string;
  status: 'active' | 'returned' | 'overdue' | 'lost';
  book: Book;
}

interface RecentLoansProps {
  loans: Loan[];
  userId: string;
}

export function RecentLoans({ loans, userId }: RecentLoansProps) {
  if (!loans || loans.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center justify-center space-y-3">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <div className="space-y-1">
            <h3 className="font-medium">Nenhum empréstimo encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Este aluno ainda não realizou empréstimos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'active';
    
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Atrasado</span>
        </Badge>
      );
    }
    
    
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Ativo</span>
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Devolvido</span>
          </Badge>
        );
      case 'lost':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Perdido</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return 'Data inválida';
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: ptBR
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      {loans.map((loan) => (
        <Card key={loan.id} className="p-4 flex flex-col md:flex-row gap-4 hover:bg-muted/50 transition-colors">
          <div className="flex-shrink-0">
            <div className="relative h-24 w-16 md:h-32 md:w-24 bg-muted rounded-md overflow-hidden">
              <div className="flex items-center justify-center h-full bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
              <div>
                <h3 className="font-medium line-clamp-1">{loan.book.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{loan.book.author}</p>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(loan.status, loan.due_date)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Emprestado: {formatDate(loan.borrowed_at)}</span>
                <span className="text-xs">({getTimeAgo(loan.borrowed_at)})</span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Devolução: {formatDate(loan.due_date)}</span>
              </div>
            </div>
            
            {loan.returned_at && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Devolvido em: {formatDate(loan.returned_at)}</span>
              </div>
            )}
            
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/loans/${loan.id}`}>
                  Ver detalhes
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      <div className="flex justify-center pt-2">
        <Button variant="outline" asChild>
          <Link href={`/admin/loans?user=${userId}`}>
            Ver todos os empréstimos
          </Link>
        </Button>
      </div>
    </div>
  );
}