import { io, Socket } from "socket.io-client";
let socket: Socket;
export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.API_URL, { autoConnect: false });
  }
  return socket;
}

export default getSocket;