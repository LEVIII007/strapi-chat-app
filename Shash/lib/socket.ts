import { io, Socket } from "socket.io-client";

type Message = {
  content: string;
  sender: 'user' | 'server';
  timestamp: string;
};

// Use NEXT_PUBLIC_API_URL as your SOCKET_URL
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

let socket: Socket | null = null;

export const getSocket = (chatId: string) => {
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

export const connectSocket = (chatId: string) => {
  const socket = getSocket(chatId);
  socket.connect();
  // Join the room for this chat using its documentId
  socket.emit("join_room", { chatId });
  return socket;
};

export const sendMessage = (content: string, chatId: string) => {
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

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
