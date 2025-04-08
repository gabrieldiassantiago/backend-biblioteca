"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface StudentUpdateData {
  full_name: string
  email: string
  class?: string
  grade?: string
  library_id: string
}

export async function updateStudent(studentId: string, data: StudentUpdateData) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Não autorizado" }
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, library_id")
      .eq("id", user.id)
      .single()

    if (userError || !userData?.role || userData.role !== "admin") {
      return { success: false, error: "Permissão negada" }
    }

    // Verify student belongs to admin's library
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("library_id")
      .eq("id", studentId)
      .single()

    if (studentError || !student || student.library_id !== userData.library_id) {
      return { success: false, error: "Aluno não encontrado" }
    }

    // Update student data
    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: data.full_name,
        email: data.email,
        class: data.class || null,
        grade: data.grade || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId)
      .eq("library_id", data.library_id)

    if (updateError) {
      console.error("Erro ao atualizar aluno:", updateError)
      return { success: false, error: updateError.message }
    }

    // Revalidate the users list and the user detail page
    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${studentId}`)

    return { success: true }
  } catch (error) {
    console.error("Erro ao processar atualização:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}


export async function updateStudentObservations(studentId: string, observations: string) {
  const supabase = await createClient()

  // Verificar se o usuário está autenticado e é um administrador
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Usuário não autenticado")
  }

  // Verificar se o usuário é um administrador
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role, library_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData || userData.role !== "admin") {
    throw new Error("Permissão negada: apenas administradores podem atualizar observações")
  }

  // Verificar se o aluno pertence à mesma biblioteca do administrador
  const { data: studentData, error: studentError } = await supabase
    .from("users")
    .select("library_id")
    .eq("id", studentId)
    .single()

  if (studentError || !studentData) {
    throw new Error("Aluno não encontrado")
  }

  if (studentData.library_id !== userData.library_id) {
    throw new Error("Permissão negada: o aluno não pertence à sua biblioteca")
  }

  // Atualizar as observações do aluno
  const { error: updateError } = await supabase
    .from("users")
    .update({
      observations: observations,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId)

  if (updateError) {
    console.error("Erro ao atualizar observações:", updateError)
    throw new Error("Erro ao atualizar observações: " + updateError.message)
  }

  // Revalidar a página para mostrar as alterações
  revalidatePath(`/admin/users/${studentId}`)
  revalidatePath("/admin/users")

  return { success: true }
}