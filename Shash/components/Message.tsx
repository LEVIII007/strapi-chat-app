'use client';
import { Bot, User } from 'lucide-react';

interface MessageProps {
  content: string;
  role: 'user' | 'server';
}

export function Message({ content, role }: MessageProps) {
  return (
    <div className={`flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
        ${role === 'server' ? 'bg-purple-500/10' : 'bg-gray-700'}
      `}>
        {role === 'server' ? (
          <Bot size={24} className="text-purple-400" />
        ) : (
          <User size={24} className="text-gray-300" />
        )}
      </div>

      {/* Message Content */}
      <div className={`
        max-w-[80%] rounded-lg p-5 font-sans text-[15px] leading-relaxed
        ${role === 'server' 
          ? 'bg-[#1a1a1a] text-gray-200' 
          : 'bg-purple-500/10 text-gray-200'}
      `}>
        <div className="prose prose-invert prose-p:text-gray-200 prose-p:font-sans prose-p:text-[15px] 
                      prose-code:text-gray-200 prose-pre:bg-[#2a2a2a] prose-pre:text-gray-200
                      max-w-none">
          ${content}
        </div>
      </div>
    </div>
  );
}
