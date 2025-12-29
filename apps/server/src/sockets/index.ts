import { Server, Socket } from "socket.io";
import { userSockets, socketToUser } from "../utils/utils";
import { subscriberClient } from "@repo/queue";
import { startMatchMaker } from "./matchMaker";
import { connection as redis } from "@repo/queue";
import {
  ACTIVE_MATCH_PREFIX,
  USER_MATCH_PREFIX,
  WAITING_LIST,
} from "../utils/constants";

export function setupSockets(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    socket.on("register", ({ userId }) => {
      if (!userId) return;
      userSockets.set(userId, socket.id);
      socketToUser.set(socket.id, userId);
      socket.join(userId);

      io.emit('onlineUsers', Array.from(userSockets.keys()));
      console.log(`User ${userId} → socket ${socket.id}`);
    });

    socket.on("join_match", ({ matchId }) => {
      socket.join(matchId);
      console.log(`Socket ${socket.id} rejoined match: ${matchId}`);
    });

    socket.on("disconnect", async () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        userSockets.delete(userId);
        socketToUser.delete(socket.id);
        try {
          await redis.lrem(WAITING_LIST, 0, userId);

          const active = await redis.get(`${USER_MATCH_PREFIX}${userId}`);
          if (active) {
            const raw = await redis.hgetall(`${ACTIVE_MATCH_PREFIX}${active}`);
            const opponentId = raw.requesterId === userId ? raw.opponentId : raw.requesterId;
            // await finishMatchById(active, { reason: "disconnect", winnerId: opponentId });
          }
        } catch (err) {
          console.error("Error removing disconnected user from waiting list:", err);
        }
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  startMatchMaker(io);

  subscriberClient.subscribe("match_events");

  subscriberClient.on("message", async (channel, message) => {
    if (channel !== "match_events") return;

    const { event, data } = JSON.parse(message);

    if (event === "submission_result") {
      const { matchId, userId, submissionId, questionId, result, details } =
        data;

      io.to(userId).emit("submission_result", {
        matchId,
        userId,
        submissionId,
        questionId,
        result,
        details,
      });

      // console.log(
      //   `Forwarded submission_result for match ${matchId}, user ${userId} → ${result.passedCount}/${result.total} passed`
      // );

      console.log(
        `Sent submission_result to user ${userId} for match ${matchId}`
      );

      if (result.passed) {
        const room = io.sockets.adapter.rooms.get(matchId);
        if (room) {
          for (const socketId of room) {
            const opponentId = socketToUser.get(socketId);
            if (opponentId && opponentId !== userId) {
              io.to(opponentId).emit("opponent_submission_passed", {
                matchId,
                opponentId: userId,
                questionId,
                submissionId,
              });
              console.log(
                `Notified opponent ${opponentId} that user ${userId} passed question ${questionId}`
              );
            }
          }
        }
      }
    } else if (event === "match_finished") {
      const { matchId } = data;
      io.to(matchId).emit("match:finished", data);
    }
  });
}