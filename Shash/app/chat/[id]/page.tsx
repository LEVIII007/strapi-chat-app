import { getChatSessionById, getChatMessages, getChatSessions } from "@/lib/queries";
import ChatInterface from "@/components/chatInterface";
import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";
import { Bot } from "lucide-react";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const { data: chatData, success: success1 } = await getChatSessionById(id);
  const { data: chats, success: success2 } = await getChatSessions();
  const { data: messagesData, success } = await getChatMessages(id);

  if (!success || !success1 || !success2) {
    return <div>Chat not found</div>;
  }

  if (!chatData || !messagesData || !chats) {
    return <div>Chat not found</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <nav className="w-full bg-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="font-display text-lg text-gray-200">{chatData.title}</h2>
              <p className="text-sm text-gray-400">{chatData.publishedAt || chatData.updatedAt}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar initialConversations={chats || []} isSidebarOpen={true} />
        {/* Chat Interface */}
        <div className="flex-1 overflow-auto">
          <ChatInterface
            initialMessages={messagesData}
            chatSession={chatData}
          />
        </div>
      </div>
    </div>
  );
}
