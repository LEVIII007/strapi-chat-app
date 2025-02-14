"use client";

import { cn } from "@/lib/utils";
import { PanelLeftClose, Plus, Pencil, Trash } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { handleSignOut } from "@/lib/clientAuth";
import CreateChatDialog from "./CreateChatDialog";
import { ChatSession } from "@/types/chat";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  conversations: ChatSession[];
  selectedChat: ChatSession | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  handleChatChange: (chat: ChatSession) => void;
  onDeleteChat: (chatId: number) => void;
  onCreateChat: (title: string) => void;
  onRenameChat: (chatId: number, newTitle: string) => void;
}

export default function Sidebar({
  conversations,
  selectedChat,
  isSidebarOpen,
  setIsSidebarOpen,
  handleChatChange,
  onDeleteChat,
  onCreateChat,
  onRenameChat,
}: SidebarProps) {
  const { data: session } = useSession();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleUserSignOut = async () => {
    await handleSignOut();
    signOut();
  };

  const handleStartRename = (chatId: number, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleFinishRename = (chatId: number) => {
    if (editingTitle.trim() && editingTitle !== conversations.find(c => c.id === chatId)?.title) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 bg-sidebar border-r border-sidebar-border p-4 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        {
          "translate-x-0": isSidebarOpen,
          "-translate-x-full": !isSidebarOpen,
        },
        {
          "md:w-1/6 md:z-0 z-20 w-1/2": isSidebarOpen,
          hidden: !isSidebarOpen,
        }
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chats</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreatingChat(true)}>
            <Plus className="h-4 w-4" />
          </Button>
          <PanelLeftClose
            className={cn("cursor-pointer w-6 h-6", {
              hidden: !isSidebarOpen,
            })}
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>

      <CreateChatDialog
        isOpen={isCreatingChat}
        onClose={() => setIsCreatingChat(false)}
        onCreateChat={onCreateChat}
      />

      <div className="flex-1 space-y-2">
        {conversations.map((chat) => (
          <div
            key={chat.id}
            className={cn("group flex items-center justify-between p-3 cursor-pointer rounded-lg", {
              "bg-secondary": selectedChat?.id === chat.id,
              "hover:bg-muted": selectedChat?.id !== chat.id,
            })}
          >
            {editingChatId === chat.id ? (
              <div className="flex items-center gap-2 w-full">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="h-6"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishRename(chat.id);
                    if (e.key === 'Escape') {
                      setEditingChatId(null);
                      setEditingTitle("");
                    }
                  }}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFinishRename(chat.id)}
                >
                  Save
                </Button>
              </div>
            ) : (
              <>
                <div onClick={() => handleChatChange(chat)}>{chat.title}</div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(chat.id, chat.title);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center space-x-3 hover:bg-secondary rounded-lg p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{session?.user?.name}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={handleUserSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
