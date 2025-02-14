"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, PanelRightClose } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";
import { getChatSessions, getChatMessages, createChatSession, deleteChatSession } from "@/lib/queries";
import AuthGuard from "@/components/AuthGuard";
import { chatStorage } from "@/lib/indexedDB";

interface ChatSession {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

export default function ChatApp() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle localStorage after component mounts
  useEffect(() => {
    const savedState = localStorage.getItem("isSidebarOpen");
    if (savedState !== null) {
      setIsSidebarOpen(savedState === "true");
    }
  }, []);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("isSidebarOpen", isSidebarOpen.toString());
  }, [isSidebarOpen]);

  // Load chats from IndexedDB on mount
  useEffect(() => {
    async function loadLocalChats() {
      try {
        const localChats = await chatStorage.getRecentChats();
        if (localChats.length > 0) {
          setChatSessions(localChats);
          setSelectedChat(localChats[0]);
        } else {
          // Fetch from server if no local chats
          const result = await getChatSessions();
          if (result.success && result.data?.data) {
            setChatSessions(result.data.data);
            if (result.data.data.length > 0) {
              setSelectedChat(result.data.data[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    }
    loadLocalChats();
  }, []);

  // Save chat to IndexedDB when messages change
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      chatStorage.saveChat({
        ...selectedChat,
        messages,
        updatedAt: Date.now(),
      });
    }
  }, [messages, selectedChat]);

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

  const sendMessage = () => {
    if (!input.trim() || !selectedChat) return;
    // TODO: Implement send message API
    const newMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: "user",
    };
    setMessages([...messages, newMessage]);
    setInput("");
  };

  const handleChatChange = (chat: ChatSession) => {
    setSelectedChat(chat);
  };

  const handleCreateChat = async (title: string, description: string) => {
    const result = await createChatSession({
      title,
      description,
    });
    
    if (result.success && result.data) {
      const newChat = result.data.data;
      setChatSessions([...chatSessions, newChat]);
      setSelectedChat(newChat);
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    const result = await deleteChatSession(chatId);
    if (result.success) {
      const updatedSessions = chatSessions.filter(chat => chat.id !== chatId);
      setChatSessions(updatedSessions);
      
      if (selectedChat?.id === chatId) {
        setSelectedChat(updatedSessions[0] || null);
      }
    }
  };

  const handleRenameChat = async (chatId: number, newTitle: string) => {
    // TODO: Implement rename chat API
    const updatedSessions = chatSessions.map(chat =>
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    );
    setChatSessions(updatedSessions);
    if (selectedChat?.id === chatId) {
      setSelectedChat({ ...selectedChat, title: newTitle });
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background justify-start text-foreground font-sans overflow-clip p-0">
        <Sidebar
          conversations={chatSessions}
          selectedChat={selectedChat}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          handleChatChange={handleChatChange}
          onDeleteChat={handleDeleteChat}
          onCreateChat={handleCreateChat}
          onRenameChat={handleRenameChat}
        />

        {/* Chat Window */}
        <div className="flex-1 flex flex-col justify-between h-screen bg-card md:p-6 py-2 px-1">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center align-middle gap-2">
              <PanelRightClose
                className={cn("cursor-pointer w-6 h-6", {
                  hidden: isSidebarOpen,
                })}
                onClick={() => setIsSidebarOpen(true)}
              />
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="flex justify-center">
                <div className="flex-1 space-y-8 max-w-3xl">
                  {messages
                    .sort((a, b) => a.id - b.id)
                    .map((msg) => (
                      <Card
                        key={msg.id}
                        className={cn("p-3 shadow-none", {
                          "ml-auto w-1/2 bg-secondary text-inherit border rounded-lg":
                            msg.sender === "user",
                          "w-full bg-inherit text-inherit border-none shadow-none":
                            msg.sender !== "user",
                        })}
                      >
                        <CardContent className="p-3 shadow-none">
                          {msg.text}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </ScrollArea>
          </div>
          {/* Input Field */}
          <div className="flex mt-4 items-center justify-center sticky bottom-0 p-4 bg-card">
            <div className="relative flex-1 flex justify-center max-w-3xl">
              <Textarea
                className="w-full bg-muted border-none text-foreground focus:ring-0 px-4 py-4 pr-10 rounded-xl"
                value={input}
                rows={4}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
              />
              <Button
                className="absolute right-2 bottom-2 bg-primary text-primary-foreground hover:bg-primary/60"
                onClick={sendMessage}
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
