"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { handleSubmitBook } from "../../app/(admin)/admin/books/actions"
import { toast } from "sonner"
import type { Book } from "../../app/(admin)/admin/books/types/BookFormData"
import { AlertCircle, BookOpen, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BookFormProps {
  book?: Book
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookForm({ book, open, onOpenChange }: BookFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [stock, setStock] = useState(book?.stock ?? 1)
  const [available, setAvailable] = useState(book?.available ?? 1)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)

      // Validar que available <= stock
      const stockValue = Number.parseInt(formData.get("stock") as string)
      const availableValue = Number.parseInt(formData.get("available") as string)

      if (availableValue > stockValue) {
        throw new Error("A quantidade disponível não pode ser maior que o estoque.")
      }

      await handleSubmitBook(formData)
      onOpenChange(false)
      router.refresh()
      toast.success(book ? "Livro atualizado com sucesso!" : "Livro adicionado com sucesso!")
    } catch (error) {
      console.error(error)
      setError((error as Error).message || "Ocorreu um erro ao processar sua solicitação.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {book ? "Editar Livro" : "Adicionar Livro"}
          </DialogTitle>
          <DialogDescription>
            {book
              ? "Atualize as informações do livro no formulário abaixo."
              : "Preencha as informações do livro para adicioná-lo ao acervo."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {book?.id && <input type="hidden" name="id" value={book.id} />}

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              defaultValue={book?.title}
              required
              autoComplete="off"
              className="focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Autor</Label>
            <Input id="author" name="author" defaultValue={book?.author} required autoComplete="off" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <Input
              id="isbn"
              name="isbn"
              defaultValue={book?.isbn}
              required
              maxLength={13}
              autoComplete="off"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque Total</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value)
                  setStock(value)
                  if (value < available) {
                    setAvailable(value)
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
                onChange={(e) => setAvailable(Number.parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

