import { Server, Socket } from "socket.io";
import { userSockets, socketToUser } from "../utils/utils";
import { subscriberClient } from "@repo/queue";
import { startMatchMaker } from "./matchMaker";
import { connection as redis } from "@repo/queue";
import { finishMatchById } from "../helpers/finishMatch.helper";
import { ACTIVE_MATCH_PREFIX, USER_MATCH_PREFIX, WAITING_LIST } from "../utils/constants";

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

  subscriberClient.subscribe("match_created");
  subscriberClient.subscribe("match_events");

  subscriberClient.on("message", async (channel, message) => {
    const { event, data } = JSON.parse(message);

    if (channel === "match_created" && event === "match_started") {
      try {
        const { matchId, requesterId, opponentId, questions, startedAt, duration } = data;
        console.log("Match start event received:", data);

        const reqSocketId = userSockets.get(requesterId);
        const oppSocketId = opponentId ? userSockets.get(opponentId) : null;

        console.log("Socket IDs → requester:", reqSocketId, "opponent:", oppSocketId);

        const reqSocket = reqSocketId ? io.sockets.sockets.get(reqSocketId) : null;
        const oppSocket = oppSocketId ? io.sockets.sockets.get(oppSocketId) : null;

        if (reqSocket) reqSocket.join(matchId);
        if (oppSocket) oppSocket.join(matchId);

        io.to(matchId).emit("match:ready", { matchId, startedAt });

        if (requesterId) {
          io.to(requesterId).emit("match_started", {
            matchId,
            opponentId,
            questions,
            startedAt,
            duration,
          });
        }

        if (opponentId) {
          io.to(opponentId).emit("match_started", {
            matchId,
            opponentId: requesterId,
            questions,
            startedAt, 
            duration,
          });
        }

        console.log(`Emitted match_started and match:ready for ${matchId}`);
      } catch (err) {
        console.error("Error in match_started handler:", err);
      }
    }

    if (channel === "match_events" && event === "submission_result") {
      const { matchId, userId, submissionId, questionId, result, details } = data;

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
        const room = io.sockets.adapter.rooms.get(matchId)
        if (room) {
          for (const socketId of room) {
            const opponentId = socketToUser.get(socketId)
            if (opponentId && opponentId !== userId) {
              io.to(opponentId).emit("opponent_submission_passed", {
                matchId,
                opponentId: userId,
                questionId,
                submissionId,
              })
              console.log(
                `Notified opponent ${opponentId} that user ${userId} passed question ${questionId}`
              );
            }
          }
        }
      }
    } else if (channel === "match_events" && event === "match_finished") {
      const { matchId, winnerId } = data;
      io.to(matchId).emit("match:finished", data);
    }
  });
}