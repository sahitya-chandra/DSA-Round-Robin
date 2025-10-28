import { Server, Socket } from 'socket.io';
import prisma from '@repo/db';
import { userSockets } from '../utils/utils';
import { subscriberClient } from '@repo/queue';

// interface AuthSocket extends Socket {
//   userId?: string;
// }

export function setupSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    // console.log('New socket:', socket.id, socket.handshake.headers.cookie);
    console.log("Client connected:", socket.id);

    socket.on('register', ({ userId }) => {
      userSockets.set(userId, socket.id)
      socket.join(userId);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    })

    socket.on('disconnect', () => {
      for(const [uid, sid] of userSockets.entries()) {
        if (sid === socket.id) userSockets.delete(uid)
      }
      console.log("Client disconnected:", socket.id);
    })
  });

  subscriberClient.subscribe("match_created")
  subscriberClient.on("message", (channel, message) => {
    const { event, data } = JSON.parse(message)

    if (event === "match_started") {
      const { matchId, status, requesterId, opponentId, questions } = data;

      io.to(requesterId).emit("match_started", {
        matchId,
        status,
        opponentId,
        questions
      })

      console.log("Received event from channel:", channel, "Payload:", message);

      if (status === "RUNNING" && opponentId) {
        io.to(opponentId).emit("match_started", {
          matchId,
          status,
          opponentId: requesterId,
          questions
        })
      }
    }
  })
}
