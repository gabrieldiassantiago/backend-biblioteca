"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type React from "react"

interface MobileNavItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description?: string
  badge?: number | null
  color?: string
}

export function MobileNavItem({ href, icon: Icon, label, description, badge, color }: MobileNavItemProps) {
  const pathname = usePathname()

  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href))

  const colorClasses = {
    violet: {
      active: "bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg",
      inactive: "hover:bg-violet-50 hover:text-violet-700",
    },
    blue: {
      active: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
      inactive: "hover:bg-blue-50 hover:text-blue-700",
    },
    teal: {
      active: "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg",
      inactive: "hover:bg-teal-50 hover:text-teal-700",
    },
    indigo: {
      active: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg",
      inactive: "hover:bg-indigo-50 hover:text-indigo-700",
    },
    purple: {
      active: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg",
      inactive: "hover:bg-purple-50 hover:text-purple-700",
    },
    slate: {
      active: "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg",
      inactive: "hover:bg-slate-50 hover:text-slate-700",
    },
    emerald: {
      active: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg",
      inactive: "hover:bg-emerald-50 hover:text-emerald-700",
    },
  }

  const colorKey = (color as keyof typeof colorClasses) || "blue"

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-in-out relative overflow-hidden",
        isActive
          ? `${colorClasses[colorKey].active} transform scale-[1.02]`
          : `text-slate-600 ${colorClasses[colorKey].inactive}`,
      )}
    >
      {/* Efeito de brilho quando ativo */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50 animate-pulse" />
      )}

      <div className="flex items-center gap-x-3 flex-1 relative z-10">
        <Icon
          className={cn(
            "h-5 w-5 transition-colors duration-300",
            isActive ? "text-white" : "text-slate-500 group-hover:text-current",
          )}
        />
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("font-semibold transition-colors duration-300", isActive ? "text-white" : "")}>
              {label}
            </span>
            {badge && (
              <Badge
                variant="destructive"
                className={cn(
                  "h-5 px-1.5 text-xs transition-all duration-300",
                  isActive ? "bg-white/20 text-white border-white/30" : "bg-red-500 hover:bg-red-600",
                )}
              >
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <span
              className={cn(
                "text-xs transition-colors duration-300",
                isActive ? "text-white/80" : "text-slate-500 group-hover:text-current",
              )}
            >
              {description}
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        className={cn(
          "h-4 w-4 transition-colors duration-300 relative z-10",
          isActive ? "text-white" : "text-slate-400 group-hover:text-current",
        )}
      />
    </Link>
  )
}
