import { io, Socket } from "socket.io-client";
import { ChatMessage } from "@/types/chat";

// Use NEXT_PUBLIC_SOCKET_URL for WebSocket connections
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:1337";

let socket: Socket | null = null;

export const getSocket = (chatId?: number) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  
  if (chatId) {
    socket.auth = { chatId };
  }
  return socket;
};

export const connectSocket = (chatId?: number) => {
  const socket = getSocket(chatId);
  return socket.connect();
};

export const sendMessage = (content: string, chatId: number) => {
  const socket = getSocket(chatId);
  if (socket) {
    const payload = {
      content,
      chatId,
      timestamp: new Date().toISOString(),
    };
    // Emit event with a dynamic name: "chat_message_<chatId>"
    socket.emit(`chat_message_${chatId}`, payload);
  }
};

export const listenForMessages = (chatId: number, callback: (message: ChatMessage) => void) => {
  const socket = getSocket(chatId);
  if (socket) {
    // Listen for messages on the event named "chat_message_<chatId>"
    socket.on(`chat_message_${chatId}`, (message: ChatMessage) => {
      callback(message);
    });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
