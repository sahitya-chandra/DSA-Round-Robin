import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initIo = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};
