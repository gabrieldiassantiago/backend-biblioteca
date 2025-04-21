
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save } from "lucide-react";

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

  const [errors, setErrors] = useState({
    libraryName: "",
    userName: "",
    contactEmail: "",
    location: ""
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors: Partial<LibrarySettings> = {};

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
        location
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
        contactEmail: apiError.message?.includes("autenticador") ? "Falha ao atualizar o email no autenticador." : prev.contactEmail
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
      <Card className="shadow-lg">
        <CardHeader className="space-y-2 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardTitle className="text-2xl text-gray-800">Informações da Biblioteca</CardTitle>
          <CardDescription className="text-gray-600">
            Atualize os detalhes, localização e informações de contato da sua biblioteca.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="libraryName" className="text-sm font-semibold text-gray-700">
              Nome da Biblioteca
            </Label>
            <Input
              type="text"
              id="libraryName"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              placeholder="Digite o nome da biblioteca"
              className="transition-all focus:ring-2 focus:ring-purple-200"
            />
            {errors.libraryName && <p className="text-red-500 text-xs mt-1">{errors.libraryName}</p>}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label htmlFor="userName" className="text-sm font-semibold text-gray-700">
              Nome do Administrador
            </Label>
            <Input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Digite seu nome"
              className="transition-all focus:ring-2 focus:ring-purple-200"
            />
            {errors.userName && <p className="text-red-500 text-xs mt-1">{errors.userName}</p>}
          </div>

          <Separator className="my-4" />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-sm font-semibold text-gray-700">
                Email de Contato
              </Label>
              <Input
                type="email"
                id="contactEmail"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contato@exemplo.com"
                className="transition-all focus:ring-2 focus:ring-purple-200"
              />
              {errors.contactEmail && (
                <p className={errors.contactEmail.includes("confirmar") ? "text-amber-600 text-xs mt-1" : "text-red-500 text-xs mt-1"}>
                  {errors.contactEmail}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                Localização da Biblioteca
              </Label>
              <Input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Digite a localização da biblioteca"
                className="transition-all focus:ring-2 focus:ring-purple-200"
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end bg-gray-50 px-6 py-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-32 bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salvo
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
