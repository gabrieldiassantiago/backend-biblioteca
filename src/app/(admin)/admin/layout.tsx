import type React from "react"
import { Inter } from "next/font/google"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Book, BookOpen, LogOut, User } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"

const inter = Inter({ subsets: ["latin"] })

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log("Erro na autenticação ou usuário não encontrado:", authError?.message || "Sessão ausente")
    redirect("/login")
  }

  const roleFromMetadata = user.user_metadata?.role
  let role = roleFromMetadata

  if (!roleFromMetadata) {
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || !userData?.role) {
      console.log("Erro ao buscar role ou role não encontrado:", userError?.message || "Dados ausentes")
      redirect("/login")
    }
    role = userData.role
  }

  if (role !== "admin") {
    console.log("Acesso negado - Role do usuário:", role)
    redirect("/login")
  }

  async function handleLogout() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  const menuItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/books", icon: Book, label: "Gerenciar Livros" },
    { href: "/admin/loans", icon: BookOpen, label: "Gerenciar Empréstimos" },
    { href: "/admin/users", icon: User, label: "Alunos" },
  ]

  return (
    <div className={`${inter.className} antialiased bg-gray-100 flex flex-col min-h-screen`}>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-700">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="h-16 flex items-center justify-center border-b border-gray-200">
              <Link href="/admin" className="flex items-center space-x-2">
                <Image src="/logounisal.svg" alt="Logo" width={32} height={32} />
                <span className="text-xl font-semibold text-gray-800">Biblioteca Digital</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-200"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <form action={handleLogout}>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full flex items-center justify-center text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/admin" className="flex items-center space-x-2">
          <Image src="/logounisal.svg" alt="Logo" width={32} height={32} />
          <span className="text-xl font-semibold text-gray-800">Biblioteca Digital</span>
        </Link>
        <div className="w-8"></div> {/* Espaço para balancear o layout */}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200">
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            <Link href="/admin" className="flex items-center space-x-2">
              <Image src="/logounisal.svg" alt="Logo" width={32} height={32} />
              <span className="text-xl font-semibold text-gray-800">Biblioteca Digital</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-200"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <form action={handleLogout}>
              <Button
                type="submit"
                variant="outline"
                className="w-full flex items-center justify-center text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

