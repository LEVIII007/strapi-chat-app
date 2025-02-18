"use client";

import { cn } from "@/lib/utils";
import { PanelLeftClose, Plus, Pencil, Trash } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import CreateChatDialog from "./CreateChatDialog";
import { ChatSession as ChatSessionType } from "@/types/chat";
import { Input } from "@/components/ui/input";
import { useRouter, usePathname } from "next/navigation";
import {
  deleteChatSession,
  RenameChat,
  createChatSession,
} from "@/lib/queries";

interface SidebarProps {
  initialConversations: ChatSessionType[];
  isSidebarOpen: boolean;
}

export default function Sidebar({ initialConversations, isSidebarOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ChatSessionType[]>(initialConversations || []);
  const [sidebarOpen, setSidebarOpen] = useState(isSidebarOpen);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  // Use documentId (string) for editing state
  const [editingChatDocumentId, setEditingChatDocumentId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  console.log("Conversations", conversations);
  console.log("initialConversations", initialConversations);

  // The URL segment uses documentId (a string)
  const selectedChatDocumentId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : null;

  const handleChatChange = (chat: ChatSessionType) => {
    router.push(`/chat/${chat.documentId}`);
  };

  useEffect(() => {
    setConversations(initialConversations || []);
  }, [initialConversations]);

  const onDeleteChat = async (documentId: string) => {
    try {
      // If the backend still requires a numeric id, convert documentId to a number.
      const res = await deleteChatSession(parseInt(documentId));
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c.documentId !== documentId));
        if (selectedChatDocumentId === documentId) {
          router.push("/");
        }
      } else {
        console.error("Failed to delete chat session:", res.message);
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
    }
  };

  const onRenameChat = async (documentId: string, newTitle: string) => {
    try {
      // Convert documentId to number if needed by the API.
      const res = await RenameChat(documentId, newTitle);
      if (res.success) {
        setConversations((prev) =>
          prev.map((c) => (c.documentId === documentId ? { ...c, title: newTitle } : c))
        );
        setEditingChatDocumentId(null);
        setEditingTitle("");
      } else {
        console.error("Failed to rename chat:", res.message);
      }
    } catch (error) {
      console.error("Error renaming chat:", error);
    }
  };

  const handleStartRename = (documentId: string, currentTitle: string) => {
    setEditingChatDocumentId(documentId);
    setEditingTitle(currentTitle);
  };

  const handleFinishRename = async (documentId: string) => {
    if (editingTitle.trim()) {
      await onRenameChat(documentId, editingTitle.trim());
    }
  };

  const handleUserSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const onCreateChat = async (title: string, description: string) => {
    try {
      const res = await createChatSession({ title, description });
      if (res.success && res.data) {
        setConversations((prev) => [...prev, res.data]);
        router.push(`/chat/${res.data.documentId}`);
      } else {
        console.error("Failed to create chat session:", res.message);
      }
    } catch (error) {
      console.error("Error creating chat session:", error);
    }
    setIsCreatingChat(false);
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 bg-sidebar border-r border-sidebar-border p-4 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        {
          "translate-x-0": sidebarOpen,
          "-translate-x-full": !sidebarOpen,
        },
        {
          "md:w-1/6 md:z-0 z-20 w-1/2": sidebarOpen,
          hidden: !sidebarOpen,
        }
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chats</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsCreatingChat(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <PanelLeftClose
            className={cn("cursor-pointer w-6 h-6", {
              hidden: !sidebarOpen,
            })}
            onClick={() => setSidebarOpen(false)}
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
            key={chat.documentId}
            className={cn(
              "group flex items-center justify-between p-3 cursor-pointer rounded-lg",
              {
                "bg-secondary": selectedChatDocumentId === chat.documentId,
                "hover:bg-muted": selectedChatDocumentId !== chat.documentId,
              }
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!editingChatDocumentId) {
                handleChatChange(chat);
              }
            }}
          >
            {editingChatDocumentId === chat.documentId ? (
              <div className="flex items-center gap-2 w-full">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="h-6"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFinishRename(chat.documentId);
                    if (e.key === "Escape") {
                      setEditingChatDocumentId(null);
                      setEditingTitle("");
                    }
                  }}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFinishRename(chat.documentId)}
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
                      handleStartRename(chat.documentId, chat.title);
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
                      onDeleteChat(chat.documentId);
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
            <DropdownMenuItem onClick={handleUserSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
