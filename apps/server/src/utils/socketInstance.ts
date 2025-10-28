import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initIo = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
    allowEIO3: true,
  });
  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};
