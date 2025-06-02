"use server"

import { createClient } from "@/lib/supabase/server"

export interface LoginState {
  error: string | null
  success: boolean
  redirectTo?: string
}

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validação básica
  if (!email || !password) {
    return {
      error: "Email e senha são obrigatórios",
      success: false,
    }
  }

  if (!email.includes("@")) {
    return {
      error: "Por favor, insira um email válido",
      success: false,
    }
  }

  try {
    const supabase = await createClient()

    // Tentativa de login
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Erro de autenticação:", authError)

      // Tratamento específico de diferentes tipos de erro
      if (authError.message.includes("Invalid login credentials")) {
        return {
          error: "Email ou senha incorretos",
          success: false,
        }
      }

      if (authError.message.includes("Email not confirmed")) {
        return {
          error: "Por favor, confirme seu email antes de fazer login",
          success: false,
        }
      }

      return {
        error: "Erro ao fazer login. Tente novamente.",
        success: false,
      }
    }

    if (!data.user) {
      return {
        error: "Falha na autenticação",
        success: false,
      }
    }

    // Verificar role do usuário
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (userError) {
      console.error("Erro ao verificar usuário:", userError)

      // Fazer logout em caso de erro
      await supabase.auth.signOut()

      return {
        error: "Erro ao verificar permissões do usuário",
        success: false,
      }
    }

    if (!userData) {
      await supabase.auth.signOut()
      return {
        error: "Usuário não encontrado no sistema",
        success: false,
      }
    }

    if (userData.role !== "admin") {
      await supabase.auth.signOut()
      return {
        error: "Apenas administradores podem acessar este sistema",
        success: false,
      }
    }

    // Se chegou até aqui, é admin - retornar sucesso para redirecionamento
    return {
      error: null,
      success: true,
      redirectTo: "/admin/",
    }
  } catch (error) {
    console.error("Erro geral no login:", error)
    return {
      error: "Erro interno do servidor. Tente novamente mais tarde.",
      success: false,
    }
  }
}
