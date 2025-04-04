"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStudent } from "./actions";
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface Student {
  id: string;
  full_name: string;
  email: string;
  class?: string;
  grade?: string;
  role: string;
  library_id: string;
}

export default function UserEditForm({ student }: { student: Student }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    full_name: student.full_name,
    email: student.email,
    class: student.class || '',
    grade: student.grade || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpar mensagem quando o usuário começa a editar
    if (message) setMessage(null);
  };

  const handleGradeChange = (value: string) => {
    setFormData(prev => ({ ...prev, grade: value }));
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateStudent(student.id, {
        ...formData,
        library_id: student.library_id
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Informações do aluno atualizadas com sucesso!' });
        // Rolar para o topo para mostrar a mensagem
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao atualizar informações.' });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage({ type: 'error', text: 'Ocorreu um erro ao processar sua solicitação.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert 
          variant={message.type === 'success' ? 'default' : 'destructive'} 
          className={message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações Pessoais</CardTitle>
            <CardDescription>
              Dados básicos do aluno
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Nome completo do aluno"
                  required
                  className="focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  required
                  className="focus-visible:ring-primary/30"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações Acadêmicas</CardTitle>
            <CardDescription>
              Dados escolares do aluno
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class">Turma</Label>
                <Input
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  placeholder="Ex: Turma A, Turma B"
                  className="focus-visible:ring-primary/30"
                />
                <p className="text-sm text-muted-foreground">
                  Opcional. Exemplo: Turma A, Turma B, etc.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Série/Ano</Label>
                <Select 
                  value={formData.grade} 
                  onValueChange={handleGradeChange}
                >
                  <SelectTrigger className="focus-visible:ring-primary/30">
                    <SelectValue placeholder="Selecione a série/ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Ensino Fundamental</SelectLabel>
                      <SelectItem value="6º Ano - Fundamental">6º Ano - Fundamental</SelectItem>
                      <SelectItem value="7º Ano - Fundamental">7º Ano - Fundamental</SelectItem>
                      <SelectItem value="8º Ano - Fundamental">8º Ano - Fundamental</SelectItem>
                      <SelectItem value="9º Ano - Fundamental">9º Ano - Fundamental</SelectItem>
                    </SelectGroup>
                    <Separator className="my-1" />
                    <SelectGroup>
                      <SelectLabel>Ensino Médio</SelectLabel>
                      <SelectItem value="1º Ano - Médio">1º Ano - Médio</SelectItem>
                      <SelectItem value="2º Ano - Médio">2º Ano - Médio</SelectItem>
                      <SelectItem value="3º Ano - Médio">3º Ano - Médio</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Opcional. Selecione a série ou ano do aluno.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          asChild
        >
          <Link href="/admin/users">Cancelar</Link>
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[140px] bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      </div>
    </form>
  );
}
