"use client";

import ChatInput from "@/components/chatInput";
import { ChatSession, ChatMessage } from "@/types/chat";


import { useState, useEffect } from 'react';
import { Message } from '@/components/Message';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Bot } from 'lucide-react';

type Message = {
  content: string;
  sender: 'user' | 'server';
  timestamp: string;
};


export default function ChatInterface({ initialMessages, chatSession }: { initialMessages: ChatMessage[], chatSession: ChatSession }) {
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map(msg => ({
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp || msg.createdAt
    }))
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };


  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white">
        {/* IntentJS Section */}

      {/* Messages Area */}
       <div className="flex-1 overflow-y-auto p-6 md:px-10 lg:px-20 space-y-8 bg-[#101010]">
        <div className="max-w-5xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center px-4 py-8 max-w-2xl mx-auto">
              <div className="p-6 rounded-2xl bg-[#181818] border border-gray-800 shadow-xl">
                <h3 className="text-xl font-display text-gray-200 mb-4">
                  Welcome to Ayna chat 🚀
                </h3>
                <p className="text-gray-400 mb-6">
                  Talk about anything from our server!
                </p>
                <div className="grid gap-3 text-left">
                  {[
                    "How do I get started with Ayna AI?",
                    "What are the features of Ayna AI?",
                    "How are you doing?"
                  ].map((question, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(question)}
                      className="p-3 text-sm text-gray-300 hover:text-white 
                              bg-[#202020] hover:bg-[#282828] rounded-lg transition-colors 
                              border border-gray-700"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.timestamp}>
                  <Message
                    content={message.content}
                    role={message.sender}
                  />
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <Message role="server" content="Typing, it may take some time..." />
          )}
        </div>
      </div>

      {/* Chat Input Area */}
      <ChatInput selectedChat={chatSession} setMessages={setMessages} />
    </div>
  );
}
