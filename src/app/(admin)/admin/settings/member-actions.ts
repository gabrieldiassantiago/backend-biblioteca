"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface LibraryMember {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

export interface NewMemberData {
  fullName: string
  email: string
  role: string
}



// Buscar todos os membros da biblioteca atual
export async function getLibraryMembers(): Promise<LibraryMember[]> {
  const supabase = await createClient()

  // 1. Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Não autorizado. Faça login para acessar os membros.")
  }

  // 2. Get user's library_id
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    
    .single()

  if (userDataError || !userData?.library_id) {
    throw new Error("Usuário não está associado a nenhuma biblioteca.")
  }

  // 3. Fetch all members of the same library
  const { data: members, error: membersError } = await supabase
    .from("users")
    .select("id, full_name, email, role, created_at")
    .eq("role", "admin") // Only fetch members, not admins
    .eq("library_id", userData.library_id)
    
    .order("created_at", { ascending: false })

  if (membersError) {
    console.error("Error fetching library members:", membersError.message)
    throw new Error("Erro ao buscar membros da biblioteca.")
  }

  return members || []
}

export async function addLibraryMember(memberData: NewMemberData) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Não autorizado.")
  }

  // 2. Get user's library_id
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single()

  if (userDataError || !userData?.library_id) {
    throw new Error("Usuário não está associado a nenhuma biblioteca.")
  }

  // 3. Check if email already exists in the same library
  const { data: existingUser, error: checkError } = await supabase
    .from("users")
    .select("id")
    .eq("email", memberData.email)
    .eq("library_id", userData.library_id)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new Error("Erro ao verificar email existente.")
  }

  if (existingUser) {
    throw new Error("Este email já está cadastrado na biblioteca.")
  }

  // 4. Create auth user (this will send an invitation email)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: memberData.email,
    email_confirm: true,
    user_metadata: {
      full_name: memberData.fullName,
    },
  })

  if (authError) {
    console.error("Error creating auth user:", authError.message)
    throw new Error("Erro ao criar usuário no sistema de autenticação.")
  }

  // 5. Insert user into users table
  const { error: insertError } = await supabase.from("users").insert({
    id: authUser.user.id,
    full_name: memberData.fullName,
    email: memberData.email,
    role: memberData.role,
    library_id: userData.library_id,
  })

  if (insertError) {
    console.error("Error inserting user:", insertError.message)
    // Try to clean up the auth user if database insert fails
    await supabase.auth.admin.deleteUser(authUser.user.id)
    throw new Error("Erro ao salvar dados do usuário.")
  }

  revalidatePath("/settings")
  return { success: true }
}

// Atualizar membro existente
export async function updateLibraryMember(memberId: string, memberData: Partial<NewMemberData>) {
  const supabase = await createClient()

  // 1. Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Não autorizado.")
  }

  // 2. Get user's library_id
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single()

  if (userDataError || !userData?.library_id) {
    throw new Error("Usuário não está associado a nenhuma biblioteca.")
  }

  // 3. Verify the member belongs to the same library
  const { data: memberToUpdate, error: memberError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", memberId)
    .single()

  if (memberError || memberToUpdate?.library_id !== userData.library_id) {
    throw new Error("Membro não encontrado ou não pertence à sua biblioteca.")
  }

  interface UpdateData {
    full_name?: string
    role?: string
    email?: string
  }

  // 4. Update user data
  const updateData: UpdateData = {}
  if (memberData.fullName) updateData.full_name = memberData.fullName
  if (memberData.role) updateData.role = memberData.role
  if (memberData.email) updateData.email = memberData.email

  const { error: updateError } = await supabase.from("users").update(updateData).eq("id", memberId)

  if (updateError) {
    console.error("Error updating member:", updateError.message)
    throw new Error("Erro ao atualizar dados do membro.")
  }

  // 5. Update auth metadata if name changed
  if (memberData.fullName) {
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(memberId, {
      user_metadata: { full_name: memberData.fullName },
    })

    if (authUpdateError) {
      console.error("Error updating auth metadata:", authUpdateError.message)
    }
  }

  revalidatePath("/settings")
  return { success: true }
}

// Remover membro da biblioteca
export async function removeLibraryMember(memberId: string) {
  const supabase = await createClient()

  // 1. Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Não autorizado.")
  }

  // 2. Prevent self-deletion
  if (user.id === memberId) {
    throw new Error("Você não pode remover a si mesmo.")
  }

  // 3. Get user's library_id
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", user.id)
    .single()

  if (userDataError || !userData?.library_id) {
    throw new Error("Usuário não está associado a nenhuma biblioteca.")
  }

  // 4. Verify the member belongs to the same library
  const { data: memberToDelete, error: memberError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", memberId)
    .single()

  if (memberError || memberToDelete?.library_id !== userData.library_id) {
    throw new Error("Membro não encontrado ou não pertence à sua biblioteca.")
  }

  // 5. Delete from users table
  const { error: deleteError } = await supabase.from("users").delete().eq("id", memberId)

  if (deleteError) {
    console.error("Error deleting member:", deleteError.message)
    throw new Error("Erro ao remover membro da biblioteca.")
  }

  // 6. Delete from auth (optional - you might want to keep the auth user)
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(memberId)

  if (authDeleteError) {
    console.error("Error deleting auth user:", authDeleteError.message)
    // Don't throw error here as the main deletion was successful
  }

  revalidatePath("/settings")
  return { success: true }
}
