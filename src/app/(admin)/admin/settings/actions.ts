"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface LibrarySettings {
  libraryName: string;
  userName: string;
  contactEmail: string;
  location: string;
  librarySlug: string; // Novo campo para o slug
}

export async function getLibrarySettings(): Promise<LibrarySettings | null> {
  const supabase = await createClient();

  // 1. Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error("Authentication error:", userError?.message);
    throw new Error("Não autorizado. Faça login para acessar as configurações.");
  }

  // 2. Fetch user data from the 'users' table
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("full_name, library_id")
    .eq("id", user.id)
    .single();

  if (userDataError || !userData) {
    console.error("Error fetching user data:", userDataError?.message);
    throw new Error("Dados do usuário não encontrados.");
  }

  if (!userData.library_id) {
    console.error(`User ${user.id} has no associated library_id.`);
    throw new Error("Usuário não está associado a nenhuma biblioteca.");
  }

  // 3. Fetch library data
  const { data: libraryData, error: libraryError } = await supabase
    .from("libraries")
    .select("name, contact_email, location, slug")
    .eq("id", userData.library_id)
    .single();

  if (libraryError || !libraryData) {
    console.error("Error fetching library data:", libraryError?.message);
    throw new Error("Dados da biblioteca não encontrados.");
  }

  // 4. Get user name from auth metadata, fallback to users table
  const authName = user.user_metadata?.full_name || userData.full_name || "";

  // 5. Ensure users table is in sync with auth metadata
  if (authName && authName !== userData.full_name) {
    const { error: syncError } = await supabase
      .from("users")
      .update({ full_name: authName })
      .eq("id", user.id);

    if (syncError) {
      console.error("Error syncing user name to users table:", syncError.message);
    }
  }

  // 6. Get email from auth, fallback to libraries table
  const authEmail = user.email || libraryData.contact_email || "";

  // 7. Ensure libraries table is in sync with auth email
  if (authEmail && authEmail !== libraryData.contact_email) {
    const { error: syncEmailError } = await supabase
      .from("libraries")
      .update({ contact_email: authEmail })
      .eq("id", userData.library_id);

    if (syncEmailError) {
      console.error("Error syncing email to libraries table:", syncEmailError.message);
    }
  }

  return {
    libraryName: libraryData.name || "",
    userName: authName,
    contactEmail: authEmail,
    location: libraryData.location || "",
    librarySlug: libraryData.slug || "",
    
  };
}

export async function updateLibrarySettings(settings: LibrarySettings) {
  const supabase = await createClient();

  // 1. Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error on update:", userError?.message);
    throw new Error("Não autorizado. Faça login para salvar as configurações.");
  }

  // 2. Fetch library_id from users table
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single();

  if (userDataError || !userData || !userData.library_id) {
    console.error("Error fetching library_id for update:", userDataError?.message);
    throw new Error("Não foi possível encontrar a biblioteca associada ao usuário para atualização.");
  }

  // 3. Update user name in auth metadata
  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { full_name: settings.userName },
    email: settings.contactEmail // Update email in auth
  });

  if (authUpdateError) {
    console.error("Error updating auth metadata or email:", authUpdateError.message);
    throw new Error("Falha ao atualizar o nome ou email no autenticador.");
  }

  // 4. Update user name in users table
  const { error: updateUserError } = await supabase
    .from("users")
    .update({
      full_name: settings.userName,
    })
    .eq("id", user.id);

  if (updateUserError) {
    console.error("Error updating user name:", updateUserError.message);
    throw new Error("Falha ao atualizar as informações do usuário.");
  }

  // 5. Update library data, including contact_email
  const { error: updateLibraryError } = await supabase
    .from("libraries")
    .update({
      name: settings.libraryName,
      contact_email: settings.contactEmail,
      location: settings.location,
      slug: settings.librarySlug,
    })
    .eq("id", userData.library_id);

  if (updateLibraryError) {
    console.error("Error updating library information:", updateLibraryError.message);
    throw new Error("Falha ao atualizar as informações da biblioteca.");
  }

  revalidatePath("/settings");
  return { success: true };
}