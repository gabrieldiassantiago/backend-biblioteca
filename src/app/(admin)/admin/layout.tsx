import type { ReactNode } from "react"
import { Inter } from 'next/font/google'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Book, BookOpen, LogOut, User, Library, ChevronRight, BookMarked, MessageCircle, Settings } from 'lucide-react'
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@radix-ui/react-dropdown-menu"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { getUserLibraryId } from "./loans/actions"

const inter = Inter({ subsets: ["latin"] })

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser();

  let libraryId;
  try {
    libraryId = await getUserLibraryId();
  } catch (error) {
    console.error("Erro ao obter libraryId:", error);
    libraryId = null;
  }
  
  const { data: userData } = await supabase
    .from("users")
    .select("name, email, library_id, role")
    .eq("id", user?.id)
    .single()

  const { data: libraryData } = await supabase
    .from("libraries")
    .select("name")
    .eq("id", libraryId)
    .single()

  const libraryName = libraryData?.name || ''
  const userRole = userData?.role || 'Administrador'

  let recentLoansCount = 0
  if (libraryId) {
    const { count } = await supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("library_id", libraryId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .eq("status", "pending")
    recentLoansCount = count || 0
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  async function handleLogout() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  const menuItems = [
    { href: "/admin", icon: Home, label: "Dashboard", description: "Visão geral da biblioteca" },
    { href: "/admin/books", icon: Book, label: "Gerenciar Livros", description: "Adicionar, editar e remover livros" },
    { 
      href: "/admin/loans", 
      icon: BookOpen, 
      label: "Empréstimos", 
      description: "Gerenciar empréstimos e devoluções",
      badge: recentLoansCount ? <Badge variant="destructive" className="ml-2">{recentLoansCount}</Badge> : null
    },
    { href: "/admin/users", icon: User, label: "Alunos", description: "Gerenciar cadastros de alunos" },
    { href: "/admin/chat", icon: MessageCircle, label: "Chat IA", description: "Use IA para automatizar suas tarefas" },
    { href: "/admin/settings", icon: Settings, label: "Configurações", description: "Configurações da biblioteca" },
  ]

  return (
    <div className={`${inter.className} antialiased bg-gray-50 flex flex-col min-h-screen transition-colors duration-300`}>
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b shadow-sm sticky top-0 z-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-white">
            <div className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-indigo-50 to-white">
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="bg-indigo-100 p-1.5 rounded-lg">
                  <Library className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="text-xl font-bold text-indigo-700">
                  Biblioteca Digital
                </span>
              </Link>
            </div>
            
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm font-medium">
                    {getInitials(libraryName)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{libraryName}</p>
                  <p className="text-xs text-gray-500">{userRole}</p>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-3 py-2">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Menu Principal
                </h3>
                <div className="space-y-1 mt-3">
                  {menuItems.map((item) => (
                    <MobileNavItem key={item.href} item={item} />
                  ))}
                </div>
              </div>
            </nav>
            
            <div className="p-4 border-t bg-gray-50">
              <form action={handleLogout}>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Encerrar Sessão
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
        
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="bg-indigo-100 p-1.5 rounded-lg">
            <Library className="h-5 w-5 text-indigo-600" />
          </div>
          <span className="text-lg font-bold text-indigo-700">
            Biblioteca Digital
          </span>
        </Link>
        
        <Avatar>
          <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm font-medium">
            {getInitials(libraryName)}
          </AvatarFallback>
        </Avatar>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r shadow-lg">
          <div className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-indigo-50 to-white sticky top-0 z-10">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                <Library className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-xl font-bold text-indigo-700">
                Biblioteca Digital
              </span>
            </Link>
          </div>
          
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm font-medium">
                  {getInitials(libraryName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{libraryName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="px-3 space-y-6">
              <div>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Menu Principal
                </h3>
                <div className="space-y-1">
                  {menuItems.map((item) => (
                    <NavItem key={item.href} item={item} />
                  ))}
                </div>
              </div>
              
              <div>
                <Separator className="my-4 bg-gray-200" />
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Recursos
                </h3>
                <div className="space-y-1">
                  <NavItem 
                    item={{
                      href: "/admin/reports",
                      icon: BookMarked,
                      label: "Relatórios",
                      description: "Estatísticas e análises"
                    }}
                  />
                </div>
              </div>
            </div>
          </nav>
          
          <div className="p-4 border-t bg-gray-50 sticky bottom-0">
            <form action={handleLogout}>
              <Button
                type="submit"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                Encerrar Sessão
              </Button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-10">{children}</div>
        </main>
      </div>
    </div>
  )
}

interface NavItemProps {
  item: {
    href: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    description?: string
    badge?: ReactNode
  }
}

function NavItem({ item }: NavItemProps) {
  const isActive = typeof window !== 'undefined' ? 
    window.location.pathname === item.href || 
    (item.href !== '/admin' && window.location.pathname.startsWith(item.href)) : 
    false

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out",
        isActive
          ? "bg-indigo-100 text-indigo-700 shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-indigo-700 hover:shadow-sm"
      )}
    >
      <item.icon className={cn(
        "h-5 w-5 transition-colors duration-200",
        isActive ? "text-indigo-700" : "text-gray-500 group-hover:text-indigo-700"
      )} />
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{item.label}</span>
          {item.badge}
        </div>
        {item.description && (
          <span className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
            {item.description}
          </span>
        )}
      </div>
    </Link>
  )
}

function MobileNavItem({ item }: NavItemProps) {
  const isActive = typeof window !== 'undefined' ? 
    window.location.pathname === item.href || 
    (item.href !== '/admin' && window.location.pathname.startsWith(item.href)) : 
    false

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out",
        isActive
          ? "bg-indigo-100 text-indigo-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-indigo-700"
      )}
    >
      <div className="flex items-center gap-x-3 flex-1">
        <item.icon className={cn(
          "h-5 w-5 transition-colors duration-200",
          isActive ? "text-indigo-700" : "text-gray-500 group-hover:text-indigo-700"
        )} />
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{item.label}</span>
            {item.badge}
          </div>
          {item.description && (
            <span className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
              {item.description}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-700 transition-colors" />
    </Link>
  )
}