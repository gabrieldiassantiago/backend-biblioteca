import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chat IA | Biblioteca Digital",
  description: "Assistente inteligente para gerenciamento da biblioteca digital",
}

export default function AdminChatPage() {
  return (
    <div className="flex h-[60vh] items-center justify-center rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
      <p className="text-center text-sm text-muted-foreground">
        A seção de chat da IA está passando por ajustes no momento.
      </p>
    </div>
  )
}
