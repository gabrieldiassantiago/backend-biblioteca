"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, Book, User, Mail, MapPin, Link } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateLibrarySettings } from "./actions";

interface LibrarySettings {
  libraryName: string;
  userName: string;
  contactEmail: string;
  location: string;
  librarySlug: string; // Novo campo para o slug
}

interface ApiError {
  message: string;
}

export default function SettingsForm({ initialData }: { initialData: LibrarySettings }) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [libraryName, setLibraryName] = useState(initialData?.libraryName || "");
  const [userName, setUserName] = useState(initialData?.userName || "");
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [librarySlug, setLibrarySlug] = useState(initialData?.librarySlug || ""); // Novo estado para o slug

  const [errors, setErrors] = useState({
    libraryName: "",
    userName: "",
    contactEmail: "",
    location: "",
    librarySlug: "" // Novo campo para erros do slug
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors: Partial<Record<keyof LibrarySettings, string>> = {};

    if (libraryName.length < 2) {
      newErrors.libraryName = "O nome da biblioteca deve ter pelo menos 2 caracteres.";
      isValid = false;
    }

    if (userName.length < 2) {
      newErrors.userName = "O nome deve ter pelo menos 2 caracteres.";
      isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(contactEmail)) {
      newErrors.contactEmail = "Por favor, insira um endereço de email válido.";
      isValid = false;
    }
    
    if (location.length < 5) {
      newErrors.location = "A localização deve ter pelo menos 5 caracteres.";
      isValid = false;
    }

    // Validação para o slug
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(librarySlug)) {
      newErrors.librarySlug = "O slug deve conter apenas letras minúsculas, números e hífens.";
      isValid = false;
    } else if (librarySlug.length < 3) {
      newErrors.librarySlug = "O slug deve ter pelo menos 3 caracteres.";
      isValid = false;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setIsSuccess(false);

      await updateLibrarySettings({
        libraryName,
        userName,
        contactEmail,
        location,
        librarySlug // Incluindo o slug na atualização
      });

      setIsSuccess(true);
      router.refresh();

      if (contactEmail !== initialData.contactEmail) {
        setErrors(prev => ({
          ...prev,
          contactEmail: "Email atualizado. Verifique sua caixa de entrada para confirmar o novo endereço."
        }));
      }
    } catch (error: unknown) {
      console.error("Erro ao atualizar configurações:", error);
      const apiError = error as ApiError;
      setErrors(prev => ({
        ...prev,
        userName: apiError.message?.includes("autenticador") ? "Falha ao atualizar o nome ou email no autenticador." : prev.userName,
        contactEmail: apiError.message?.includes("autenticador") ? "Falha ao atualizar o email no autenticador." : prev.contactEmail,
        librarySlug: apiError.message?.includes("slug") ? "Este slug já está em uso. Escolha outro." : prev.librarySlug
      }));
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-7xl mx-auto">
      <Card className="shadow-xl border-t-4  rounded-xl overflow-hidden transition-all hover:shadow-2xl">
        <CardHeader className="space-y-2 bg-gradient-to-r from-purple-100 to-blue-100 pb-6">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Book className="h-6 w-6 text-purple-600" />
            Informações da Biblioteca
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Atualize os detalhes, localização e informações de contato da sua biblioteca.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6 bg-white">
          <div className="space-y-3">
            <Label htmlFor="libraryName" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Book className="h-4 w-4 text-purple-600" />
              Nome da Biblioteca
            </Label>
            <Input
              type="text"
              id="libraryName"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              placeholder="Digite o nome da biblioteca"
              className="transition-all border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
            {errors.libraryName && <p className="text-red-500 text-xs mt-1">{errors.libraryName}</p>}
          </div>
          
          <Separator className="my-6" />

          <div className="space-y-3">
            <Label htmlFor="librarySlug" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Link className="h-4 w-4 text-purple-600" />
              Slug da Biblioteca
            </Label>
            <div className="flex items-center">
              <span className="bg-gray-100 px-3 py-2 text-gray-500 border border-r-0 border-gray-300 rounded-l-md">
                biblioteca.com/
              </span>
              <Input
                type="text"
                id="librarySlug"
                value={librarySlug}
                onChange={(e) => setLibrarySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="seu-slug-aqui"
                className="transition-all border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-l-none"
              />
            </div>
            {errors.librarySlug && <p className="text-red-500 text-xs mt-1">{errors.librarySlug}</p>}
            {!errors.librarySlug && (
              <p className="text-xs text-gray-500 mt-1">
                O slug será usado na URL da sua biblioteca. Use apenas letras minúsculas, números e hífens.
              </p>
            )}
          </div>

          <Separator className="my-6" />

          <div className="space-y-3">
            <Label htmlFor="userName" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <User className="h-4 w-4 text-purple-600" />
              Nome do Administrador
            </Label>
            <Input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Digite seu nome"
              className="transition-all border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
            {errors.userName && <p className="text-red-500 text-xs mt-1">{errors.userName}</p>}
          </div>

          <Separator className="my-6" />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="contactEmail" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Mail className="h-4 w-4 text-purple-600" />
                Email de Contato
              </Label>
              <Input
                type="email"
                id="contactEmail"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contato@exemplo.com"
                className="transition-all border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
              {errors.contactEmail && (
                <p className={errors.contactEmail.includes("confirmar") ? "text-amber-600 text-xs mt-1" : "text-red-500 text-xs mt-1"}>
                  {errors.contactEmail}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="h-4 w-4 text-purple-600" />
                Localização da Biblioteca
              </Label>
              <Input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Digite a localização da biblioteca"
                className="transition-all border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end bg-gray-50 px-6 py-4 border-t border-gray-100">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-36 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isSaving ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </div>
            ) : isSuccess ? (
              <div className="flex items-center justify-center">
                <Check className="h-4 w-4 mr-2" />
                Salvo
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </div>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}