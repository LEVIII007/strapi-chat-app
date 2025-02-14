import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:1337"; // Strapi server URL

let socket: Socket | null = null;

export const connectSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ["websocket"], // Use WebSocket transport
        });

        socket.on("connect", () => {
            console.log("Connected to WebSocket server");
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from WebSocket server");
        });
    }
    return socket;
};

export const sendMessage = (message: string) => {
    if (socket) {
        socket.emit("message", { content: message });
    }
};

export const listenForMessages = (callback: (message: string) => void) => {
    if (socket) {
        socket.on("message", (data) => {
            callback(data.content);
        });
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
