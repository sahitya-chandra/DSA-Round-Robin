import { Server, Socket } from "socket.io";
import { userSockets, socketToUser } from "../utils/utils";
import { subscriberClient } from "@repo/queue";
import { startMatchMaker } from "./matchMaker";
import { createMatch } from "../helpers/matchMaker.helper";
import { finishMatchById } from "../helpers/finishMatch.helper";
import { connection as redis } from "@repo/queue";
import {
  ACTIVE_MATCH_PREFIX,
  USER_MATCH_PREFIX,
  WAITING_LIST,
  SUBMISSIONS_PREFIX,
} from "../utils/constants";

// const inviteTimeouts = new Map<string, NodeJS.Timeout>()
// const clearInviteTimeout = (inviterId: string, friendId: string) => {
//   const key = `${inviterId}:${friendId}`;
//   const timeout = inviteTimeouts.get(key);
//   if (timeout) {
//     clearTimeout(timeout);
//     inviteTimeouts.delete(key);
//   }
// };

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

          // for (const key of inviteTimeouts.keys()) {
          //   const [inviterId, friendId] = key.split(":");

          //   if (inviterId === userId || friendId === userId) {
          //     const otherId = inviterId === userId ? friendId : inviterId;
          //     const otherSocketId = userSockets.get(otherId!);

          //     if (otherSocketId) {
          //       io.to(otherSocketId).emit("invite_error", {
          //         message: "Invite cancelled (user disconnected)",
          //       });
          //     }

          //     clearInviteTimeout(inviterId!, friendId!);
          //   }
          // }
        } catch (err) {
          console.error("Error removing disconnected user from waiting list:", err);
        }
      }
      console.log("Client disconnected:", socket.id);
      io.emit('onlineUsers', Array.from(userSockets.keys()));
    });

    // Friend Duel Invitation Handlers
    socket.on("invite_friend", async ({ friendId, inviterName }) => {
      const requesterId = socketToUser.get(socket.id);
      if (!requesterId || !friendId) return;

      // const inviteKey = `${requesterId}:${friendId}`;
      // if (inviteTimeouts.has(inviteKey)) {
      //   socket.emit("invite_error", { message: "Invite already pending" });
      //   return;
      // }

      console.log(`User ${requesterId} (${inviterName}) inviting ${friendId}`);

      const friendSocketId = userSockets.get(friendId);
      if (!friendSocketId) {
        socket.emit("invite_error", { message: "User is offline" });
        return;
      }
  
      const friendActiveMatch = await redis.get(`${USER_MATCH_PREFIX}${friendId}`);
      if (friendActiveMatch) {
        socket.emit("friend_busy", { friendId });
        return;
      }

      io.to(friendSocketId).emit("invite_received", {
        inviterId: requesterId,
        inviterName, 
      });

      const timeoutId = setTimeout(() => {
        // if (!inviteTimeouts.has(inviteKey)) return;
        // inviteTimeouts.delete(inviteKey);
        io.to(socket.id).emit("invite_expired", { friendId });
        io.to(friendSocketId).emit("invite_expired", { inviterId: requesterId });
      }, 10000);

      // inviteTimeouts.set(inviteKey, timeoutId);
    });

    socket.on("invite_response", async ({ inviterId, response }) => {
      const friendId = socketToUser.get(socket.id);
      if (!friendId || !inviterId) return;

      // const inviteKey = `${inviterId}:${friendId}`;
      // if (!inviteTimeouts.has(inviteKey)) {
      //   socket.emit("invite_error", { message: "Invite no longer valid" });
      //   return;
      // }

      const inviterSocketId = userSockets.get(inviterId);
      const friendSocketId = userSockets.get(friendId)

      if (response === "accept") {
        const inviterActiveMatch = await redis.get(`${USER_MATCH_PREFIX}${inviterId}`);
        if (inviterActiveMatch) {
           socket.emit("invite_error", { message: "Inviter is now busy" });
          //  clearInviteTimeout(inviterId, friendId);
           return;
        }
        
        console.log(`User ${friendId} accepted invite from ${inviterId}`);
        if (inviterSocketId) {
          io.to(inviterSocketId).emit("invite_accepted", { friendId });
        }
        
        try {
          const match = await createMatch(inviterId, friendId);
          if (!match) {
            socket.emit("invite_error", { message: "Failed to create match" });
            if (inviterSocketId) io.to(inviterSocketId).emit("invite_error", { message: "Failed to create match" });
            // clearInviteTimeout(inviterId, friendId);
            return;
          }

          const { matchId, questions, startedAt, duration } = match;

          if (inviterSocketId && friendSocketId) {
            const inviterSocket = io.sockets.sockets.get(inviterSocketId);
            const friendSocket = io.sockets.sockets.get(friendSocketId)
            inviterSocket?.join(matchId);
            friendSocket?.join(matchId)
          }

          const commonPayload = {
            matchId,
            questions,
            startedAt,
            duration,
          };

          io.to(matchId).emit("match:ready", { matchId, startedAt });

          io.to(inviterId).emit("match_started", { ...commonPayload, opponentId: friendId });
          io.to(friendId).emit("match_started", { ...commonPayload, opponentId: inviterId });
          
          // clearInviteTimeout(inviterId, friendId);

        } catch (err) {
            console.error("Error creating friend match:", err);
            socket.emit("invite_error", { message: "Server error creating match" });
            // clearInviteTimeout(inviterId, friendId);
        }

      } else if (response === "reject") {
         if (inviterSocketId) {
            io.to(inviterSocketId).emit("invite_rejected", { friendId });
            // clearInviteTimeout(inviterId, friendId);
         }
      }
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
        try {
          const rawMatch = await redis.hgetall(`${ACTIVE_MATCH_PREFIX}${matchId}`);
          if (rawMatch && rawMatch.questions) {
            const questions = JSON.parse(rawMatch.questions);
            const totalQuestions = questions.length;

            const subHashKey = `${SUBMISSIONS_PREFIX}${matchId}:${userId}`;
            const userSubs = await redis.hgetall(subHashKey);
            const solvedIds = new Set<number>();
            
            Object.values(userSubs).forEach((s: string) => {
              const sub = JSON.parse(s);
              if (sub.status === "DONE" && sub.result?.passed) {
                solvedIds.add(sub.questionId);
              }
            });

            if (solvedIds.size === totalQuestions) {
               console.log(`User ${userId} solved all questions! Finishing match ${matchId}.`);
               await finishMatchById(matchId, { winnerId: userId });
            }
          }
        } catch (err) {
            console.error("Error checking for auto-finish:", err);
        }

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