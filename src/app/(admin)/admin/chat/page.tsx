import { LibraryChatInterface } from "@/components/chat/admin-chat-interface"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chat IA | Biblioteca Digital",
  description: "Assistente inteligente para gerenciamento da biblioteca digital",
}

export default function AdminChatPage() {
  return (
    <div className=" w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
      <LibraryChatInterface />
    </div>
  )
}
