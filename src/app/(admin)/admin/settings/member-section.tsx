"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  User,
  Shield,
  Loader2,
  HelpCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  getLibraryMembers,
  addLibraryMember,
  updateLibraryMember,
  removeLibraryMember,
  type LibraryMember,
  type NewMemberData,
} from "./member-actions";

// -----------------------------------------------------
// Se quiser, pode transformar em prop vinda de fora
const areaDesativada = true;
// -----------------------------------------------------

const ROLES = [
  { value: "diretor", label: "Diretor" },
  { value: "professor", label: "Professor" },
  { value: "bibliotecario", label: "Bibliotecário" },
  { value: "assistente", label: "Assistente" },
  { value: "estagiario", label: "Estagiário" },
];

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "diretor":
      return "default";
    case "professor":
      return "secondary";
    case "bibliotecario":
      return "outline";
    default:
      return "outline";
  }
};

export default function MembersManagement() {
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<LibraryMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [newMember, setNewMember] = useState<NewMemberData>({
    fullName: "",
    email: "",
    role: "",
  });

  const [editMember, setEditMember] = useState<NewMemberData>({
    fullName: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getLibraryMembers();
      setMembers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.fullName || !newMember.email || !newMember.role) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await addLibraryMember(newMember);
      setNewMember({ fullName: "", email: "", role: "" });
      setIsAddDialogOpen(false);
      await loadMembers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editMember.fullName || !editMember.role) {
      setError("Nome e cargo são obrigatórios.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await updateLibraryMember(editingMember.id, {
        fullName: editMember.fullName,
        role: editMember.role,
      });
      setIsEditDialogOpen(false);
      setEditingMember(null);
      await loadMembers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setError("");
      await removeLibraryMember(memberId);
      await loadMembers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openEditDialog = (member: LibraryMember) => {
    setEditingMember(member);
    setEditMember({
      fullName: member.full_name,
      email: member.email,
      role: member.role,
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros da Biblioteca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      {/* Overlay de desativação */}
      {areaDesativada && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-600 text-center px-4">
            <Shield className="w-6 h-6" />
            <span className="text-sm font-medium">Área temporariamente desativada</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-5 w-5 text-slate-500 hover:text-slate-700 cursor-pointer pointer-events-auto" />
                </TooltipTrigger>
                <TooltipContent>
               Essa seria a aba de gerenciamento de novos adminstradores da biblioteca! 
               Estamos trabalhando nela para você e logo estará disponível!
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* CONTINUA normalmente abaixo */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5" />
              Membros da Biblioteca
            </CardTitle>
            <CardDescription>
              Gerencie os membros que têm acesso à biblioteca. Total: {members.length} membros
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Membro</DialogTitle>
                <DialogDescription>
                  Adicione um novo membro à biblioteca. Um email de convite será enviado.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-name">Nome Completo</Label>
                    <Input
                      id="add-name"
                      value={newMember.fullName}
                      onChange={(e) =>
                        setNewMember({ ...newMember, fullName: e.target.value })
                      }
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-email">Email</Label>
                    <Input
                      id="add-email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) =>
                        setNewMember({ ...newMember, email: e.target.value })
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-role">Cargo</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(value) =>
                        setNewMember({ ...newMember, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && (
                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      "Adicionar Membro"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {error && (
          <div className="m-6 text-sm text-red-500 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum membro cadastrado ainda.</p>
            <p className="text-sm">Adicione o primeiro membro à biblioteca.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {member.full_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {member.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {ROLES.find((r) => r.value === member.role)?.label || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover <strong>{member.full_name}</strong>?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
