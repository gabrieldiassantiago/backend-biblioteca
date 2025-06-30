"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type React from "react"

import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description?: string
  badge?: number | null
  color?: string
  disabled?: boolean
}

export function NavItem({ href, icon: Icon, label, description, badge, disabled = false }: NavItemProps) {
  const pathname = usePathname()

  // Lógica mais precisa para determinar se o item está ativo
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href))

  const containerClasses = cn(
    "group flex items-center gap-x-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ease-in-out border relative overflow-hidden",
    isActive
      ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
      : "text-slate-600 hover:bg-blue-50/50 hover:text-blue-600 border-transparent hover:border-blue-100",
    disabled && "pointer-events-none opacity-60"
  )

  const content = (
    <>
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
          isActive
            ? "bg-blue-100 text-blue-600"
            : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{label}</span>
          {badge && (
            <Badge
              variant="destructive"
              className={cn(
                "h-5 px-1.5 text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white",
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <span
            className={cn(
              "text-xs transition-all duration-200 truncate",
              isActive ? "text-blue-600/80" : "text-slate-500 group-hover:text-blue-600/80",
            )}
          >
            {description}
          </span>
        )}
      </div>

      {/* Indicador lateral quando ativo */}
      {isActive && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-l-full" />
      )}
      {disabled && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="ml-auto h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right">Em manutenção</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  )

  if (disabled) {
    return <div className={containerClasses}>{content}</div>
  }

  return (
    <Link href={href} className={containerClasses}>
      {content}
    </Link>
  )
}
