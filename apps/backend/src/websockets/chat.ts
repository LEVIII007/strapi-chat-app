'use strict';

import { Server } from 'socket.io';
import axios from 'axios';


export default {
  register() {},

  bootstrap({ strapi }) {
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      console.log('A client connected');

      // Handle joining a chat session
      socket.on('join_session', async (data) => {
        try {
          const response = await axios.get(
            `${process.env.STRAPI_URL}/api/chat-sessions/${data.sessionId}?populate=account`
          );
          const session = response.data.data;

          if (!session || session.attributes.account.data.id !== data.accountId) {
            socket.emit('error', { message: 'Invalid session' });
            return;
          }

          socket.join(`session_${data.sessionId}`);
          socket.emit('joined_session', { sessionId: data.sessionId });
        } catch (error) {
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // Handle new messages
      socket.on('send_message', async (data) => {
        try {
          // Create user message in database
          const userMessageData = {
            data: {
              content: data.content,
              sender: 'user',
              session: data.sessionId,
              timestamp: new Date()
            }
          };

          const userMessage = await axios.post(
            `${process.env.STRAPI_URL}/api/chat-messages`,
            userMessageData
          );

          // Create server response message
          const serverMessageData = {
            data: {
              content: data.content, // Echo the same content
              sender: 'server', 
              session: data.sessionId,
              timestamp: new Date()
            }
          };

          const serverMessage = await axios.post(
            `${process.env.STRAPI_URL}/api/chat-messages`,
            serverMessageData
          );

          // Emit both messages to the session
          io.to(`session_${data.sessionId}`).emit('new_message', {
            userMessage: userMessage.data.data,
            serverResponse: serverMessage.data.data
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }
};