import { AdminChatInterface } from "@/components/chat/admin-chat-interface"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chat IA | Biblioteca Digital",
  description: "Assistente inteligente para gerenciamento da biblioteca digital",
}

export default function AdminChatPage() {
  return (
    <div className="h-[calc(100vh-6rem)] w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
      <AdminChatInterface />
    </div>
  )
}
