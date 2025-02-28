import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleSubmitBook } from "./actions";
import { toast } from "sonner";
import type { Book } from "./BookFormData";

interface BookFormProps {
  book?: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookForm({ book, open, onOpenChange }: BookFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [stock, setStock] = useState(book?.stock ?? 1);
  const [available, setAvailable] = useState(book?.available ? 1 : 0);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);

      // Validar que available <= stock
      const stockValue = parseInt(formData.get("stock") as string);
      const availableValue = parseInt(formData.get("available") as string);

      if (availableValue > stockValue) {
        throw new Error("A quantidade disponível não pode ser maior que o estoque.");
      }

      await handleSubmitBook(formData);
      onOpenChange(false);
      router.refresh();
      toast.success(book ? "Livro atualizado com sucesso!" : "Livro adicionado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error(book ? "Erro ao atualizar o livro." : "Erro ao adicionar o livro.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{book ? "Editar Livro" : "Adicionar Livro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {book?.id && <input type="hidden" name="id" value={book.id} />}

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={book?.title} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Autor</Label>
            <Input id="author" name="author" defaultValue={book?.author} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <Input id="isbn" name="isbn" defaultValue={book?.isbn} required maxLength={13} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Estoque Total</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setStock(value);
                if (value < available) {
                  setAvailable(value);
                }
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="available">Quantidade Disponível</Label>
            <Input
              id="available"
              name="available"
              type="number"
              min="0"
              max={stock}
              value={available}
              onChange={(e) => setAvailable(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}