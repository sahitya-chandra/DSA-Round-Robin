import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import prisma from '@repo/db';
import { userSockets } from '../utils/utils';

interface AuthSocket extends Socket {
  userId?: string;
}

export function setupSockets(io: Server) {
  io.on('connection', (socket: AuthSocket) => {
    // TODO: handle authentication
    // TODO: handle sendMessage event
    // TODO: handle typing event
    // TODO: handle disconnect event
  });
}
