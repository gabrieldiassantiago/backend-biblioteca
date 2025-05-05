"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  Save,
  Book,
  User,
  Mail,
  MapPin,
  Link,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateLibrarySettings } from "./actions";

interface LibrarySettings {
  libraryName: string;
  userName: string;
  contactEmail: string;
  location: string;
  librarySlug: string;
}

interface ApiError {
  message: string;
}

export default function SettingsForm({
  initialData,
}: {
  initialData: LibrarySettings;
}) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [libraryName, setLibraryName] = useState(
    initialData?.libraryName || ""
  );
  const [userName, setUserName] = useState(initialData?.userName || "");
  const [contactEmail, setContactEmail] = useState(
    initialData?.contactEmail || ""
  );
  const [location, setLocation] = useState(initialData?.location || "");
  const [librarySlug, setLibrarySlug] = useState(
    initialData?.librarySlug || ""
  );

  const [errors, setErrors] = useState({
    libraryName: "",
    userName: "",
    contactEmail: "",
    location: "",
    librarySlug: "",
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors: Partial<Record<keyof LibrarySettings, string>> = {};

    if (libraryName.length < 2) {
      newErrors.libraryName =
        "O nome da biblioteca deve ter pelo menos 2 caracteres.";
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

    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(librarySlug)) {
      newErrors.librarySlug =
        "O slug deve conter apenas letras minúsculas, números e hífens.";
      isValid = false;
    } else if (librarySlug.length < 3) {
      newErrors.librarySlug = "O slug deve ter pelo menos 3 caracteres.";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
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
        librarySlug,
      });

      setIsSuccess(true);
      router.refresh();

      if (contactEmail !== initialData.contactEmail) {
        setErrors((prev) => ({
          ...prev,
          contactEmail:
            "Email atualizado. Verifique sua caixa de entrada para confirmar o novo endereço.",
        }));
      }
    } catch (error: unknown) {
      console.error("Erro ao atualizar configurações:", error);
      const apiError = error as ApiError;
      setErrors((prev) => ({
        ...prev,
        userName: apiError.message?.includes("autenticador")
          ? "Falha ao atualizar o nome ou email no autenticador."
          : prev.userName,
        contactEmail: apiError.message?.includes("autenticador")
          ? "Falha ao atualizar o email no autenticador."
          : prev.contactEmail,
        librarySlug: apiError.message?.includes("slug")
          ? "Este slug já está em uso. Escolha outro."
          : prev.librarySlug,
      }));
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 max-w-7xl mx-auto px-4 lg:px-0"
    >
      <Card className="rounded-md border">
        <CardHeader className="p-6 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Book className="h-5 w-5" />
            Informações da Biblioteca
          </CardTitle>
          <CardDescription>
            Atualize os detalhes, localização e informações de contato da sua
            biblioteca.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Nome da biblioteca */}
          <div className="space-y-2">
            <Label
              htmlFor="libraryName"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Book className="h-4 w-4" />
              Nome da Biblioteca
            </Label>
            <Input
              type="text"
              id="libraryName"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              placeholder="Digite o nome da biblioteca"
            />
            {errors.libraryName && (
              <p className="text-red-500 text-xs">{errors.libraryName}</p>
            )}
          </div>

          <Separator />

          {/* Slug */}
          <div className="space-y-2">
            <Label
              htmlFor="librarySlug"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Link className="h-4 w-4" />
              Slug da Biblioteca
            </Label>
            <div className="flex items-center">
              <span className="rounded-l-md border border-r-0 px-3 py-2 text-sm text-muted-foreground">
                biblioteca.com/
              </span>
              <Input
                type="text"
                id="librarySlug"
                value={librarySlug}
                onChange={(e) =>
                  setLibrarySlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  )
                }
                placeholder="seu-slug-aqui"
                className="rounded-l-none"
              />
            </div>
            {errors.librarySlug ? (
              <p className="text-red-500 text-xs">{errors.librarySlug}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Slug é uma parte da URL que identifica exclusivamente a biblioteca. É através dele que os usuários acessarão sua biblioteca online. Use letras minúsculas, números e hífens.
              </p>
            )}
          </div>

          <Separator />

          {/* Nome do administrador */}
          <div className="space-y-2">
            <Label
              htmlFor="userName"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <User className="h-4 w-4" />
              Nome do Administrador
            </Label>
            <Input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Digite seu nome"
            />
            {errors.userName && (
              <p className="text-red-500 text-xs">{errors.userName}</p>
            )}
          </div>

          <Separator />

          {/* Grid de email + localização */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="contactEmail"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Mail className="h-4 w-4" />
                Email de Contato
              </Label>
              <Input
                type="email"
                id="contactEmail"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contato@exemplo.com"
              />
              {errors.contactEmail && (
                <p
                  className={
                    errors.contactEmail.includes("confirmar")
                      ? "text-amber-600 text-xs"
                      : "text-red-500 text-xs"
                  }
                >
                  {errors.contactEmail}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="location"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <MapPin className="h-4 w-4" />
                Localização da Biblioteca
              </Label>
              <Input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Digite a localização da biblioteca"
              />
              {errors.location && (
                <p className="text-red-500 text-xs">{errors.location}</p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t p-6">
          <Button type="submit" disabled={isSaving} className="w-36">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : isSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Salvo
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Salvar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
