import { Server, Socket } from "socket.io";
import { userSockets, socketToUser } from "../utils/utils";
import { subscriberClient, WAITING_LIST } from "@repo/queue";
import { startMatchMaker } from "./matchMaker";
import { connection as redis } from "@repo/queue";

export function setupSockets(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    socket.on("register", ({ userId }) => {
      if (!userId) return;
      userSockets.set(userId, socket.id);
      socketToUser.set(socket.id, userId);
      socket.join(userId); 
      console.log(`User ${userId} → socket ${socket.id}`);
    });

    socket.on("disconnect", async () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        userSockets.delete(userId);
        socketToUser.delete(socket.id);

        try {
          await redis.lrem(WAITING_LIST, 0, userId);
        } catch (err) {
          console.error("Error removing disconnected user from waiting list:", err);
        }
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  startMatchMaker(io);

  subscriberClient.subscribe("match_created");
  subscriberClient.on("message", async (channel, message) => {
    if (channel !== "match_created") return;
    const { event, data } = JSON.parse(message);
    if (event !== "match_started") return;

    const { matchId, requesterId, opponentId, questions } = data;

    const reqSocketId = userSockets.get(requesterId);
    const oppSocketId = opponentId ? userSockets.get(opponentId) : null;

    if (reqSocketId) io.sockets.sockets.get(reqSocketId)?.join(matchId);
    if (oppSocketId) io.sockets.sockets.get(oppSocketId)?.join(matchId);

    if (requesterId) {
      io.to(requesterId).emit("match_started", {
        matchId,
        opponentId,
        questions,
      });
    }

    if (opponentId) {
      io.to(opponentId).emit("match_started", {
        matchId,
        opponentId: requesterId,
        questions,
      });
    }

    console.log(`Emitted match_started for ${matchId}`);
  });
}
