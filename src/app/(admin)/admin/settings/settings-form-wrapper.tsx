import SettingsForm from "./settings-form";
import { getLibrarySettings } from "./actions";

// Interface para garantir a tipagem dos dados das configurações
interface LibrarySettings {
  libraryName: string;
  userName: string;
  contactEmail: string;
  location: string;
}

// Componente Wrapper que busca os dados iniciais e renderiza o formulário
export default async function SettingsFormWrapper() {
  try {
    // Busca as configurações iniciais do servidor
    const settings = await getLibrarySettings();

    // Garante que temos dados seguros (fallback para strings vazias)
    // Isso evita erros caso `getLibrarySettings` retorne null/undefined ou dados parciais
    const safeSettings: LibrarySettings = {
      libraryName: settings?.libraryName || "",
      userName: settings?.userName || "",
      contactEmail: settings?.contactEmail || "",
      location: settings?.location || "",
    };

    // Renderiza o formulário passando os dados iniciais seguros
    return <SettingsForm  initialData={safeSettings} />;

  } catch (error) {
    // Exibe uma mensagem de erro se a busca de dados falhar
    // É uma boa prática logar o erro também para depuração no servidor
    console.error("Falha ao carregar configurações:", error); 
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
        Erro ao carregar as configurações: {(error as Error).message}
      </div>
    );
  }
}
