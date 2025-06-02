"use client"

import { useState } from "react"
import { Bell, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface NotificationCenterProps {
  totalNotifications: number
  recentLoansCount: number
  overdueLoansCount: number
}

interface Notification {
  id: string
  type: "loan" | "overdue" | "system" | "success"
  title: string
  message: string
  time: string
  read: boolean
}

export function NotificationCenter({
  recentLoansCount,
  overdueLoansCount,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    [
      {
        id: "1",
        type: "loan" as const,
        title: "Novos Empréstimos",
        message: `${recentLoansCount} novos empréstimos pendentes de aprovação`,
        time: "Agora",
        read: false,
      },
      {
        id: "2",
        type: "overdue" as const,
        title: "Empréstimos Atrasados",
        message: `${overdueLoansCount} empréstimos estão em atraso`,
        time: "5 min atrás",
        read: false,
      },
      {
        id: "3",
        type: "system" as const,
        title: "Backup Realizado",
        message: "Backup automático dos dados foi concluído com sucesso",
        time: "1 hora atrás",
        read: true,
      },
      {
        id: "4",
        type: "success" as const,
        title: "Novo Livro Adicionado",
        message: '"Dom Casmurro" foi adicionado ao catálogo',
        time: "2 horas atrás",
        read: true,
      },
    ].filter((notification) => {
      if (notification.type === "loan" && recentLoansCount === 0) return false
      if (notification.type === "overdue" && overdueLoansCount === 0) return false
      return true
    }),
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "loan":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-slate-500" />
    }
  }

  const getNotificationBg = (type: Notification["type"], read: boolean) => {
    if (read) return "bg-slate-50"

    switch (type) {
      case "loan":
        return "bg-blue-50 border-l-4 border-blue-400"
      case "overdue":
        return "bg-red-50 border-l-4 border-red-400"
      case "success":
        return "bg-green-50 border-l-4 border-green-400"
      default:
        return "bg-slate-50 border-l-4 border-slate-400"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold bg-red-500 hover:bg-red-600 animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl"
      >
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-violet-600" />
              <h3 className="font-semibold text-slate-900">Notificações</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                  {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-100"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhuma notificação</p>
              <p className="text-xs text-slate-400 mt-1">Você está em dia!</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "p-3 rounded-lg transition-all duration-200 hover:bg-slate-100 cursor-pointer group",
                      getNotificationBg(notification.type, notification.read),
                      !notification.read && "shadow-sm",
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              notification.read ? "text-slate-600" : "text-slate-900",
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-violet-500 rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-xs mt-1 line-clamp-2",
                            notification.read ? "text-slate-500" : "text-slate-700",
                          )}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <DropdownMenuSeparator className="my-1" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50"
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}