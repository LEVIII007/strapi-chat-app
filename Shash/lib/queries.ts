'use server';

import { auth } from "../auth";
import dotenv from "dotenv";
import { ChatSession } from "@/types/chat";

dotenv.config();

const SERVER_URL = process.env.API_URL || "http://localhost:1337";

console.log("SERVER_URL", SERVER_URL);

export async function getChatSessions(): Promise<{
    success: boolean;
    data?: ChatSession[];
    message?: string;
  }> {
    const session = await auth();
  
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }
  
    try {
      // URL encode the user's email
      const encodedEmail = encodeURIComponent(session.user.email as string);
      // Filter chat sessions by the user's email instead of user ID.
      const response = await fetch(
        `${SERVER_URL}/api/chat-sessions?filters[email][$eq]=${encodedEmail}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            
          },
        }
      );

      console.log("Response", response);
  
      if (!response.ok) {
        throw new Error(`Failed to fetch chat sessions: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      return { success: false, message: "Error fetching chat sessions" };
    }
  }
  

export async function getChatSessionById(id: string) {
  const session = await auth();

  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  console.log("Session", session);
  console.log("ID", id);

  try {
    const response = await fetch(
      `${SERVER_URL}/api/chat-sessions/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: session.jwt as string, // Using JWT for authentication
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chat session: ${response.statusText}`);
    }

    const data = await response.json();

    return { success: true, data : data.data };
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return { success: false, message: "Error fetching chat session" };
  }
}

export async function createChatSession(data: { title: string; description: string }) {
  const session = await auth();

  console.log("Session", session);

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    console.log("Creating chat session with data:", data);
    console.log("User Email:", session.user.email);
    // Build the payload using the user's email instead of their ID.
    const response = await fetch(
      `${SERVER_URL}/api/chat-sessions`,
      {
        method: "POST",
        headers: {
          Authorization: session.jwt as string,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            title: data.title,
            description: data.description,
            email: session.user.email, // Associate the session with the user's email
          },
        }),
      }
    );

    console.log("Response", response.body);

    if (!response.ok) {
      const errorData = await response.json(); // Capture server error details
      throw new Error(
        `Failed to create chat session: ${errorData?.error?.message || response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log("Chat session created successfully:", responseData.data);
    return { success: true, data: responseData.data };
  } catch (error: unknown) {
    console.error("Error creating chat session:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error creating chat session",
    };
  }
}

export async function deleteChatSession(chatSessionId: number) {
  const session = await auth();

  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const response = await fetch(
      `${SERVER_URL}/api/chat-sessions/${chatSessionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete chat session: ${response.statusText}`);
    }

    return { success: true, message: "Chat session deleted successfully" };
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return { success: false, message: "Error deleting chat session" };
  }
}

export async function saveMessage(
  chatSessionId: number,
  content: string,
  sender: "user" | "server"
) {
  const session = await auth();

  if (!session || !session.user?.email) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    // Verify that the chat session exists and belongs to the user
    const chatResponse = await fetch(
      `${SERVER_URL}/api/chat-sessions/${chatSessionId}`,
      {
        headers: {
          Authorization: `Bearer ${session.jwt}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!chatResponse.ok) {
      return { success: false, message: "Chat session not found or access denied" };
    }

    // Save the message in the database
    const response = await fetch(
      `${SERVER_URL}/api/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            content,
            sender,
            chat_session: chatSessionId, // Link message to chat session
            timestamp: new Date().toISOString(), // Store timestamp
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: `Failed to save message: ${errorData?.error?.message || response.statusText}`,
      };
    }

    const messageData = await response.json();
    return { success: true, data: messageData };
  } catch (error) {
    console.error("Error saving message:", error);
    return { success: false, message: "Internal Server Error" };
  }
}

export async function getChatMessages(chatSessionId: string) {
  const session = await auth();

  if (!session) {
    return { success: false, message: "Unauthorized" };
  }
  console.log("Session", session);
    console.log("ChatSessionId", chatSessionId);

  try {
    const response = await fetch(
      `${SERVER_URL}/api/messages?filters[chat_session][documentId][$eq]=${chatSessionId}&sort=timestamp:asc`,
      {
        headers: {
          Authorization: session.jwt as string,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Response", response);

    if (!response.ok) {
      return { success: false, message: "Failed to fetch messages" };
    }

    console.log("Response", response);

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, message: "Internal Server Error" };
  }
}

export async function deleteMessage(messageId: string) {
  const session = await auth();

  if (!session || !session.user?.email) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const response = await fetch(
      `${SERVER_URL}/api/messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: session.jwt as string,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { success: false, message: "Failed to delete message" };
    }

    return { success: true, message: "Message deleted successfully" };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, message: "Internal Server Error" };
  }
}

export async function RenameChat(chatId: string, newTitle: string) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return { success: false, message: "Unauthorized" };
  }
  try {
    const response = await fetch(
      `${SERVER_URL}/api/chat-sessions/${chatId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
        }),
      }
    );
    if (!response.ok) {
      return { success: false, message: "Failed to rename chat" };
    }
    return { success: true, message: "Chat renamed successfully" };
  } catch (error) {
    console.error("Error renaming chat:", error);
    return { success: false, message: "Internal Server Error" };
  }
}


