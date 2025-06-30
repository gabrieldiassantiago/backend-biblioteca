"use client"

import { Home, Book, BookOpen, User, MessageCircle, Settings, BookMarked } from 'lucide-react'
import { NavItem } from "./nav-item"
import { MobileNavItem } from "./mobile-nav-item"

interface NavigationProps {
  recentLoansCount: number
  isMobile?: boolean
}

export function Navigation({ recentLoansCount, isMobile = false }: NavigationProps) {
  const menuItems = [
    {
      href: "/admin",
      icon: Home,
      label: "Dashboard",
      description: "Visão geral da biblioteca",
    },
    {
      href: "/admin/books",
      icon: Book,
      label: "Gerenciar Livros",
      description: "Adicionar, editar e remover livros",
    },
    {
      href: "/admin/loans",
      icon: BookOpen,
      label: "Empréstimos",
      description: "Gerenciar empréstimos e devoluções",
      badge: recentLoansCount > 0 ? recentLoansCount : null,
    },
    {
      href: "/admin/users",
      icon: User,
      label: "Alunos",
      description: "Gerenciar cadastros de alunos",
    },
    {
      href: "/admin/chat",
      icon: MessageCircle,
      label: "Chat IA",
      description: "Use IA para automatizar suas tarefas",
      disabled: true,
    },
    {
      href: "/admin/settings",
      icon: Settings,
      label: "Configurações",
      description: "Configurações da biblioteca",
    },
  ]

  const additionalItems = [
    {
      href: "/admin/reports",
      icon: BookMarked,
      label: "Relatórios",
      description: "Estatísticas e análises detalhadas",
    },
  ]

  const NavComponent = isMobile ? MobileNavItem : NavItem

  return (
    <>
      <div>
        <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Menu Principal</h3>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavComponent key={item.href} {...item} />
          ))}
        </div>
      </div>

      {!isMobile && (
        <div>
          <div className="my-6 h-px bg-slate-200" />
          <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Recursos Avançados
          </h3>
          <div className="space-y-1">
            {additionalItems.map((item) => (
              <NavComponent key={item.href} {...item} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}