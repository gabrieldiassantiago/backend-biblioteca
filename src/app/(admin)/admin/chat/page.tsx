import { AdminChatInterface } from "../../../../components/chat/admin-chat-interface"

export const metadata = {
  title: "Admin Chat | Biblioteca Digital",
  description: "Interface administrativa de chat da Biblioteca Digital",
}

export default function AdminChatPage() {
  return (
    <div className="container overflow-hidden">
     
     <div className=" h-screen w-full overflow-hidden">
     <AdminChatInterface />
     </div>
    </div>
  )
}
