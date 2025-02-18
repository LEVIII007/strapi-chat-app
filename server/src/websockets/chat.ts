'use strict';

import { Server } from 'socket.io';

export function setupWebSocket(strapi) {
  process.nextTick(() => {
    console.log('🚀 Setting up WebSocket server');
    const httpServer = strapi.server.httpServer || strapi.server;

    if (!httpServer) {
      console.error("❌ Strapi HTTP server not found. WebSocket will not work.");
      return;
    }

    const io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
      },
    });

    strapi.io = io;  // Global registration for later use

    io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);

      // Handle joining a room
      socket.on('join_room', (data) => {
        const { chatId } = data;
        if (!chatId) {
          socket.emit('error', { message: 'chatId is required to join a room' });
          return;
        }
        const roomName = `chat_${chatId}`;
        socket.join(roomName);
        console.log(`🔗 Socket ${socket.id} joined room ${roomName}`);
      });

      // Listen for dynamic chat message events (e.g., "chat_message_<documentId>")
      socket.onAny(async (event, data) => {
        if (event.startsWith("chat_message_")) {
          try {
            console.log('📨 Received event:', event, 'Data:', data);

            // Extract chatId (documentId) from the event name
            const chatId = event.replace("chat_message_", "");

            if (!chatId || !data.content) {
              socket.emit('error', { message: 'chatId and content are required' });
              return;
            }

            // Save the user's message
            await strapi.entityService.create('api::message.message', {
              data: {
                content: data.content,
                sender: 'user',
                chat_session: chatId,
                publishedAt: new Date(),
              },
            });

            // Save the server's echo message
            const serverMessage = await strapi.entityService.create('api::message.message', {
              data: {
                content: `Echo: ${data.content}`,
                sender: 'server',
                chat_session: chatId,
                publishedAt: new Date(),
              },
            });

            // Emit the message back to the room for this chat
            const dynamicEvent = `chat_message_${chatId}`;
            io.to(`chat_${chatId}`).emit(dynamicEvent, {
              id: serverMessage.id,
              content: serverMessage.content,
              sender: serverMessage.sender,
              // Optionally, include a timestamp:
              timestamp: serverMessage.created_at,
            });

            console.log(`📤 Emitted ${dynamicEvent} to room chat_${chatId}`);
          } catch (error) {
            console.error('❌ Error handling message:', error);
            socket.emit('error', { message: 'Failed to process message' });
          }
        }
      });

      socket.on('disconnect', () => {
        console.log('⚠️ Client disconnected:', socket.id);
      });
    });
  });
}
