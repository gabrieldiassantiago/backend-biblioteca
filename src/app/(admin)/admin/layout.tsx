import type { ReactNode } from "react"
import { Inter } from 'next/font/google'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Book, BookOpen, LogOut, User, Library, ChevronRight, BookMarked, MessageCircle } from 'lucide-react'
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@radix-ui/react-dropdown-menu"
import { redirect } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()

  // Obter dados do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user?.id)
    .single()

  const userName = userData?.name || user?.email?.split('@')[0] || 'Administrador'
  const userEmail = userData?.email || user?.email || ''
  
  // Obter iniciais para o avatar
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
    { href: "/admin/loans", icon: BookOpen, label: "Empréstimos", description: "Gerenciar empréstimos e devoluções" },
    { href: "/admin/users", icon: User, label: "Alunos", description: "Gerenciar cadastros de alunos" },
    { href: "/admin/chat", icon: MessageCircle, label: "Chat IA", description: "Use IA para automatizar suas tarefas" },

  ]

  return (
    <div className={`${inter.className} antialiased bg-background flex flex-col min-h-screen`}>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b shadow-sm">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-primary/10 to-background">
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="bg-primary/10 p-1 rounded-md">
                  <Library className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  Biblioteca Digital
                </span>
              </Link>
            </div>
            
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={`https://avatar.vercel.sh/${user?.id}.png`} alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-3 py-2">
                <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Menu Principal
                </h3>
                <div className="space-y-1 mt-2">
                  {menuItems.map((item) => (
                    <MobileNavItem key={item.href} item={item} />
                  ))}
                </div>
              </div>
            </nav>
            
            <div className="p-4 border-t">
              <form action={handleLogout}>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                >
                  <LogOut className="h-4 w-4" />
                  Encerrar Sessão
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
        
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="bg-primary/10 p-1 rounded-md">
            <Library className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Biblioteca Digital
          </span>
        </Link>
        
        <Avatar className="h-8 w-8 border border-primary/20">
          <AvatarImage src={`https://avatar.vercel.sh/${user?.id}.png`} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-card border-r shadow-sm">
          <div className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-primary/10 to-background">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="bg-primary/10 p-1 rounded-md">
                <Library className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Biblioteca Digital
              </span>
            </Link>
          </div>
          
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={`https://avatar.vercel.sh/${user?.id}.png`} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="px-3 space-y-6">
              <div>
                <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Menu Principal
                </h3>
                <div className="space-y-1">
                  {menuItems.map((item) => (
                    <NavItem key={item.href} item={item} />
                  ))}
                </div>
              </div>
              
              <div>
                <Separator className="my-4 bg-border/60" />
                <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
          
          <div className="p-4 border-t">
            <form action={handleLogout}>
              <Button
                type="submit"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Encerrar Sessão
              </Button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto px-4 py-8">{children}</div>
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
        "group flex items-center gap-x-3 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className={cn(
        "h-5 w-5 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )} />
      <div className="flex flex-col">
        <span>{item.label}</span>
        {item.description && (
          <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
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
        "group flex items-center justify-between rounded-md px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-x-3">
        <item.icon className={cn(
          "h-5 w-5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )} />
        <div className="flex flex-col">
          <span>{item.label}</span>
          {item.description && (
            <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
              {item.description}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground/80" />
    </Link>
  )
}