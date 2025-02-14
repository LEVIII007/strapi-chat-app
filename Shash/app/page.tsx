"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { connectSocket, sendMessage} from "@/lib/socket";
import { getChatSessions, getChatMessages, RenameChat, createChatSession } from "@/lib/queries";
import AuthGuard from "@/components/AuthGuard";
import { chatStorage } from "@/lib/indexedDB";
import { ChatSession, ChatMessage } from "@/types/chat";
import Sidebar from "@/components/Sidebar";

export default function ChatPage() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<any>(null);

  // Load chats from IndexedDB or server on mount
  useEffect(() => {
    async function loadChats() {
      try {
        const localChats = await chatStorage.getRecentChats();
        if (localChats.length > 0) {
          setChatSessions(localChats as ChatSession[]);
          setSelectedChat(localChats[0] as ChatSession);
        } else {
          const result = await getChatSessions();
          if (result.success && result.data?.data) {
            setChatSessions(result.data.data);
            if (result.data.data.length > 0) {
              setSelectedChat(result.data.data[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error loading chats:", error);
      }
    }
    loadChats();
  }, []);

  // Fetch messages when selected chat changes
  useEffect(() => {
    async function fetchMessages() {
      if (selectedChat) {
        const result = await getChatMessages(selectedChat.id);
        if (result.success && result.data) {
          setMessages(result.data);
        }
      }
    }
    fetchMessages();
  }, [selectedChat]);

  // Save messages to IndexedDB when messages change
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      chatStorage.saveChat({
        ...selectedChat,
        messages: messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp,
          chatId: selectedChat.id,
        })),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [messages, selectedChat]);

  // Initialize socket connection only once when component mounts
  useEffect(() => {
    const socketInstance = connectSocket(); // Connect without specifying chatId here
    setSocket(socketInstance);

    // Optionally log connection events
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
    });
    socketInstance.on("disconnect", () => {
      console.warn("⚠️ Socket disconnected");
    });

    return () => {
      // Cleanup listeners and disconnect only on unmount
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, []);

  // Setup dynamic event listener and join room when selectedChat changes
  useEffect(() => {
    if (!socket || !selectedChat) return;
    const dynamicEvent = `chat_message_${selectedChat.id}`;

    // Join the room for the selected chat (if your server supports it)
    socket.emit("join_room", { chatId: selectedChat.id });
    // Remove any previous listener for the dynamic event
    socket.off(dynamicEvent);
    // Listen for messages on the dynamic event
    socket.on(dynamicEvent, (message: ChatMessage) => {
      console.log("📩 Received via socket:", message);
      if (message.chatId === selectedChat.id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Cleanup: Remove listener when selectedChat changes
    return () => {
      socket.off(dynamicEvent);
    };
  }, [socket, selectedChat]);

  // Handle sending message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat || !socket) return;

    // Create and display user message immediately
    const userMessage: ChatMessage = {
      id: Date.now(),
      content: input,
      sender: "user",
      timestamp: new Date(),
      chatId: selectedChat.id,
    };
    setMessages((prev) => [...prev, userMessage]);
    // Send message using the dynamic event via sendMessage helper
    sendMessage(input, selectedChat.id);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleCreateChat = async (title: string) => {
    try {
      const result = await createChatSession({ title, description: '' });
      if (result.success && result.data) {
        const newChat = result.data.data;
        setChatSessions(prev => [...prev, newChat]);
        setSelectedChat(newChat);
        setIsSidebarOpen(false); // Close sidebar after creating chat
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleRenameChat = async (chatId: number, newTitle: string) => {
    try {
      const result = await RenameChat(chatId, newTitle);
      if (result.success) {
        // Update chat sessions with new title
        setChatSessions(prev => prev.map(chat => 
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        ));
        // Update selected chat if it's the renamed one
        if (selectedChat?.id === chatId) {
          setSelectedChat(prev => prev ? { ...prev, title: newTitle } : null);
        }
      }
    } catch (error) {
      console.error("Error renaming chat:", error);
    }
  };

  const renderSidebar = () => (
    <Sidebar
      conversations={chatSessions}
      selectedChat={selectedChat}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      handleChatChange={(chat: ChatSession) => setSelectedChat(chat)}
      onDeleteChat={(chatId: number) => {
        // Delete chat logic will be implemented later
        console.log("Delete chat:", chatId);
      }}
      onCreateChat={handleCreateChat}
      onRenameChat={handleRenameChat}
    />
  );

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background text-foreground font-sans">
        {isSidebarOpen && renderSidebar()}
        <div className="flex-1 flex flex-col bg-card p-4">
          <div className="flex items-center mb-2">
            <PanelRightClose className="w-6 h-6 cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
            <h2 className="ml-2 text-xl font-bold">
              {selectedChat?.title || "No Chat Selected"}
            </h2>
          </div>
          <ScrollArea className="flex-1 border p-2 mb-2">
            <div className="flex justify-center">
              <div className="flex-1 space-y-4 max-w-3xl">
                {messages.sort((a, b) => a.id - b.id).map((msg) => (
                  <Card
                    key={msg.id}
                    className={cn("p-2 my-1 rounded", {
                      "bg-grey-900 text-white ml-auto": msg.sender === "user",
                      "bg-gray-900 text-white mr-auto": msg.sender === "server",
                    })}
                  >
                    <CardContent>{msg.content}</CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              rows={4}
            />
            <Button type="submit" className="bg-primary hover:bg-primary/80">
              <Send size={16} />
            </Button>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}