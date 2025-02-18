"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getChatSessions, createChatSession } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";
import CreateChatDialog from "@/components/CreateChatDialog";
import { useRouter } from "next/navigation";
import { ChatSession } from "@/types/chat";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  console.log("Chats", chats);

  useEffect(() => {
    // Fetch chat sessions for authenticated user.
    getChatSessions().then(({ data }) => {
      if (data) {
        setChats(data);
      } else {
        setChats([]);
      }
    });
  }, []);

  const handleCreateChat = async (title: string, description: string) => {
    try {
      const response = await createChatSession({ title, description });
      console.log("Response", response);
      if (!response.success || !response.data) {
        console.error("Failed to create chat:", response.message);
        toast({
          title: "Failed to create chat",
          description: "An error occurred while creating the chat session.",
        });
        return;
      }
      toast({
        title: "Chat session created",
        description: "You can now start chatting with your friends.",
      })
      return router.push(`/chat/${response.data.documentId}`);
    } catch (error) {
      console.error("Error creating chat session:", error);
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar initialConversations={chats} isSidebarOpen={true} />
        <main className="flex-1 p-4 flex flex-col items-center justify-center">
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start New Chat
          </Button>
          <CreateChatDialog 
            isOpen={isDialogOpen}
            onClose={() => setDialogOpen(false)}
            onCreateChat={handleCreateChat}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
