"use client";
import { useEffect, useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { connectSocket, sendMessage } from "@/lib/socket";
import { ChatMessage, ChatSession } from "@/types/chat";

interface ChatInputProps {
  selectedChat: ChatSession | null;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function ChatInput({ selectedChat, setMessages }: ChatInputProps) {
  const [input, setInput] = useState("");
  
  const socket = useMemo(() => {
    if (selectedChat) {
      return connectSocket(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (!socket || !selectedChat) return;
    socket.off("chat_message"); // Cleanup previous listeners
    socket.on("chat_message", (message: ChatMessage) => {
      console.log("📩 Received Message:", message);
      if (message.chatId === selectedChat.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      socket.off("chat_message");
      socket.disconnect();
    };
  }, [socket, selectedChat, setMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat || !socket) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      content: input,
      sender: "user",
      timestamp: new Date(),
      chatId: selectedChat.id,
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessage(input, selectedChat.id);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex mt-4 items-center justify-center sticky bottom-0 p-4 bg-card">
      <div className="relative flex-1 flex justify-center max-w-3xl">
        <Textarea
          className="w-full bg-muted border-none text-foreground focus:ring-0 px-4 py-4 pr-10 rounded-xl"
          value={input}
          rows={4}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
        />
        <Button
          className="absolute right-2 bottom-2 bg-primary text-primary-foreground hover:bg-primary/60"
          onClick={handleSendMessage}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
