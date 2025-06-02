import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, Library } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { redirect } from "next/navigation"
import { getUserLibraryId } from "./loans/actions"
import { NotificationCenter } from "./notification-center"
import { Navigation } from "./navigation"


const inter = Inter({ subsets: ["latin"] })

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let libraryId
  try {
    libraryId = await getUserLibraryId()
  } catch (error) {
    console.error("Erro ao obter libraryId:", error)
    libraryId = null
  }

  const { data: userData } = await supabase
    .from("users")
    .select("name, email, library_id, role")
    .eq("id", user?.id)
    .single()

  const { data: libraryData } = await supabase.from("libraries").select("name").eq("id", libraryId).single()

  const libraryName = libraryData?.name || ""
  const userRole = userData?.role || "Administrador"

  let recentLoansCount = 0
  let overdueLoansCount = 0
  let totalNotifications = 0

  if (libraryId) {
    const { count: pendingCount } = await supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("library_id", libraryId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .eq("status", "pending")

    const { count: overdueCount } = await supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("library_id", libraryId)
      .eq("status", "active")
      .lt("due_date", new Date().toISOString())

    recentLoansCount = pendingCount || 0
    overdueLoansCount = overdueCount || 0
    totalNotifications = recentLoansCount + overdueLoansCount
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  async function handleLogout() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div
      className={`${inter.className} antialiased bg-slate-50 flex flex-col min-h-screen transition-all duration-300`}
    >
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-white border-r border-slate-200">
            <MobileSidebar
              libraryName={libraryName}
              userRole={userRole}
              recentLoansCount={recentLoansCount}
              handleLogout={handleLogout}
              getInitials={getInitials}
            />
          </SheetContent>
        </Sheet>

        <Link href="/admin" className="flex items-center space-x-2">
          <div className="bg-blue-500 p-2 rounded-lg shadow-sm">
            <Library className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-blue-600">Biblioteca Digital</span>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationCenter
            totalNotifications={totalNotifications}
            recentLoansCount={recentLoansCount}
            overdueLoansCount={overdueLoansCount}
          />
          <Avatar className="ring-2 ring-blue-100">
            <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
              {getInitials(libraryName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-80 bg-white border-r border-slate-200 shadow-sm">
          {/* Header */}
          <div className="h-20 flex items-center px-6 border-b border-slate-200 bg-blue-50/30 sticky top-0 z-10">
            <Link href="/admin" className="flex items-center space-x-3 group">
              <div className="bg-blue-500 p-2.5 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:bg-blue-600">
                <Library className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-blue-600">Biblioteca Digital</span>
                <span className="text-xs text-slate-500">Sistema de Gestão</span>
              </div>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center space-x-4">
              <Avatar className="ring-2 ring-blue-200 shadow-sm">
                <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                  {getInitials(libraryName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{libraryName}</p>
                <p className="text-xs text-slate-500">{userRole}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
              <NotificationCenter
                totalNotifications={totalNotifications}
                recentLoansCount={recentLoansCount}
                overdueLoansCount={overdueLoansCount}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4">
            <div className="space-y-6">
              <Navigation recentLoansCount={recentLoansCount} />
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-6 border-t border-slate-200 bg-slate-50/50 sticky bottom-0">
            <form action={handleLogout}>
              <Button
                type="submit"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-200 border-slate-200"
              >
                <LogOut className="h-4 w-4" />
                Encerrar Sessão
              </Button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="container mx-auto px-6 py-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

function MobileSidebar({
  libraryName,
  userRole,
  recentLoansCount,
  handleLogout,
  getInitials,
}: {
  libraryName: string
  userRole: string
  recentLoansCount: number
  handleLogout: () => void
  getInitials: (name: string) => string
}) {
  return (
    <>
      <div className="h-20 flex items-center px-6 border-b border-slate-200 bg-blue-50/30">
        <Link href="/admin" className="flex items-center space-x-3">
          <div className="bg-blue-500 p-2 rounded-lg shadow-sm">
            <Library className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-blue-600">Biblioteca Digital</span>
            <span className="text-xs text-slate-500">Sistema de Gestão</span>
          </div>
        </Link>
      </div>

      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <Avatar className="ring-2 ring-blue-200">
            <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
              {getInitials(libraryName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{libraryName}</p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 py-2">
          <Navigation recentLoansCount={recentLoansCount} isMobile />
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <form action={handleLogout}>
          <Button
            type="submit"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Encerrar Sessão
          </Button>
        </form>
      </div>
    </>
  )
}