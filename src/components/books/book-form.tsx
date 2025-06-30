"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpen, Loader2, X, Upload, LinkIcon } from 'lucide-react';
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handleSubmitBook } from "@/app/(admin)/admin/books/book-actions";
import Image from "next/image";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  stock: number;
  available: number;
  library_id: string;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

interface BookFormProps {
  book?: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookForm({ book, open, onOpenChange }: BookFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [stock, setStock] = useState(book?.stock ?? 1);
  const [available, setAvailable] = useState(book?.available ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string>(book?.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState<string>(book?.image_url ?? "");
  const [imageMethod, setImageMethod] = useState<"upload" | "url">("upload");

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setUrlInput("");
    };
    reader.readAsDataURL(file);
  }, [file]);

  useEffect(() => {
    if (urlInput && imageMethod === "url") {
      setPreviewUrl(urlInput);
      setFile(null);
    }
  }, [urlInput, imageMethod]);

  const clearImage = () => {
    setPreviewUrl("");
    setFile(null);
    setUrlInput("");
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setFormErrors({});

    try {
      const formData = new FormData(event.currentTarget);
      const stockValue = parseInt(formData.get("stock") as string, 10);
      const availableValue = parseInt(formData.get("available") as string, 10);
      const isbn = formData.get("isbn") as string;

      // Additional validations
      const errors: Record<string, string> = {};
      if (isbn && !/^\d{10,13}$/.test(isbn)) {
        errors.isbn = "ISBN deve ter 10 ou 13 dígitos numéricos.";
      }
      if (availableValue > stockValue) {
        errors.available = "Quantidade disponível não pode ser maior que o estoque.";
      }
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        throw new Error("Por favor, corrija os erros no formulário.");
      }

      if (file) {
        formData.set("image_file", file);
        formData.delete("image_url");
      }

      await handleSubmitBook(formData);
      onOpenChange(false);
      router.refresh();
      toast.success(book ? "Livro atualizado com sucesso!" : "Livro adicionado com sucesso!", {
        style: { background: "#10B981", color: "#fff" },
      });
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Erro ao salvar o livro.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            {book ? "Editar Livro" : "Adicionar Novo Livro"}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {book
              ? "Atualize as informações do livro abaixo."
              : "Preencha as informações para cadastrar um novo livro na biblioteca."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setError(null)}
              className="ml-auto h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-8">
          {book?.id && <input type="hidden" name="id" value={book.id} />}

          {/* Image Section */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Capa do Livro</Label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview */}
              <div className="space-y-4">
                <div className="relative group">
                  {previewUrl ? (
                    <div className="relative">
                      <Image
                        width={300}
                        height={400}
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview da capa"
                        className="w-full h-64 rounded-xl object-cover border-2 border-gray-200 shadow-lg transition-all duration-300 group-hover:shadow-xl"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-64 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 transition-colors hover:border-gray-400">
                      <BookOpen className="h-12 w-12 mb-3 text-gray-400" />
                      <p className="text-sm font-medium">Nenhuma capa selecionada</p>
                      <p className="text-xs text-gray-400">Adicione uma imagem abaixo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Options */}
              <div className="space-y-4">
                <Tabs value={imageMethod} onValueChange={(v) => setImageMethod(v as "upload" | "url")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      URL
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-3">
                    <div className="relative">
                      <Input
                        id="image_file"
                        name="image_file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setFile(e.target.files[0]);
                        }}
                        disabled={isLoading}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: JPG, PNG, WebP (máx. 5MB)
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-3">
                    <Input
                      id="image_url"
                      name="image_url"
                      type="url"
                      placeholder="https://exemplo.com/capa-do-livro.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isLoading}
                      className="transition-all duration-200"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole o link direto para a imagem da capa
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div className="space-y-6">
            <Label className="text-lg font-semibold">Informações do Livro</Label>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Título *
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={book?.title}
                  required
                  disabled={isLoading}
                  placeholder="Digite o título do livro"
                  className={`transition-all duration-200 ${formErrors.title ? "border-red-500 focus:border-red-500" : "focus:border-primary"}`}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm font-medium text-gray-700">
                  Autor *
                </Label>
                <Input
                  id="author"
                  name="author"
                  defaultValue={book?.author}
                  required
                  disabled={isLoading}
                  placeholder="Nome do autor"
                  className={`transition-all duration-200 ${formErrors.author ? "border-red-500 focus:border-red-500" : "focus:border-primary"}`}
                />
                {formErrors.author && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.author}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isbn" className="text-sm font-medium text-gray-700">
                ISBN *
              </Label>
              <Input
                id="isbn"
                name="isbn"
                defaultValue={book?.isbn}
                required
                maxLength={13}
                disabled={isLoading}
                placeholder="1234567890123"
                className={`font-mono transition-all duration-200 ${formErrors.isbn ? "border-red-500 focus:border-red-500" : "focus:border-primary"}`}
              />
              <p className="text-xs text-muted-foreground">
                Código ISBN de 10 ou 13 dígitos (apenas números)
              </p>
              {formErrors.isbn && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.isbn}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-medium text-gray-700">
                  Estoque Total *
                </Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 0;
                    setStock(v);
                    if (v < available) setAvailable(v);
                  }}
                  required
                  disabled={isLoading}
                  className="transition-all duration-200"
                />
                {formErrors.stock && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.stock}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="available" className="text-sm font-medium text-gray-700">
                  Disponível *
                </Label>
                <Input
                  id="available"
                  name="available"
                  type="number"
                  min="0"
                  max={stock}
                  value={available}
                  onChange={(e) => setAvailable(parseInt(e.target.value, 10) || 0)}
                  required
                  disabled={isLoading}
                  className="transition-all duration-200"
                />
                <p className="text-xs text-muted-foreground">
                  Máximo: {stock} unidades
                </p>
                {formErrors.available && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.available}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-primary hover:bg-primary/90 transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  {book ? "Atualizar Livro" : "Adicionar Livro"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
