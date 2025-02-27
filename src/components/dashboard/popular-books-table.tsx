"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"

// Dados fictícios para demonstração
const popularBooks = [
  {
    id: "1",
    title: "O Senhor dos Anéis",
    author: "J.R.R. Tolkien",
    loans: 42,
    available: 3,
    stock: 5
  },
  {
    id: "2",
    title: "Harry Potter e a Pedra Filosofal",
    author: "J.K. Rowling",
    loans: 38,
    available: 2,
    stock: 4
  },
  {
    id: "3",
    title: "1984",
    author: "George Orwell",
    loans: 35,
    available: 0,
    stock: 3
  },
  {
    id: "4",
    title: "Dom Quixote",
    author: "Miguel de Cervantes",
    loans: 30,
    available: 1,
    stock: 2
  },
  {
    id: "5",
    title: "A Metamorfose",
    author: "Franz Kafka",
    loans: 28,
    available: 2,
    stock: 3
  }
]

export function PopularBooksTable() {
  const [isMobile, setIsMobile] = useState(false);

  // Verificar o tamanho da tela quando o componente é montado
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar inicialmente
    handleResize();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Renderização para dispositivos móveis
  const renderMobileView = () => {
    return (
      <div className="space-y-4">
        {popularBooks.map((book) => (
          <Card key={book.id} className="p-4">
            <div className="font-medium text-lg mb-2">{book.title}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Autor:</div>
              <div>{book.author}</div>
              
              <div className="text-muted-foreground">Empréstimos:</div>
              <div>{book.loans}</div>
              
              <div className="text-muted-foreground">Disponibilidade:</div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(book.available / book.stock) * 100} 
                  className="h-2 w-16"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {book.available}/{book.stock}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // Renderização para desktop
  const renderDesktopView = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Título</TableHead>
            <TableHead className="whitespace-nowrap">Autor</TableHead>
            <TableHead className="whitespace-nowrap">Empréstimos</TableHead>
            <TableHead className="whitespace-nowrap">Disponibilidade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {popularBooks.map((book) => (
            <TableRow key={book.id}>
              <TableCell className="font-medium whitespace-nowrap">{book.title}</TableCell>
              <TableCell className="whitespace-nowrap">{book.author}</TableCell>
              <TableCell className="whitespace-nowrap">{book.loans}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress 
                    value={(book.available / book.stock) * 100} 
                    className="h-2"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {book.available}/{book.stock}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Livros Mais Populares</CardTitle>
        <CardDescription>
          Os 5 livros mais emprestados da biblioteca
        </CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "" : "overflow-x-auto"}>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  )
}