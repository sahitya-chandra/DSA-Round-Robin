import { Server, Socket } from "socket.io";
import { chatUserSockets, chatSocketToUser } from "../utils/utils";
import prisma from "@repo/db";
import { createManualMatch } from "../services/match.service";

interface AuthSocket extends Socket {
  userId?: string;
}
interface MatchCreateResponse {
  matchId?: string;
  error?: string;
  [key: string]: unknown;
}


export function setupChatSocket(io: Server) {
  console.log("💬 Chat socket initialized...");

  io.of("/friends").on("connection", (socket: AuthSocket) => {
    const userId = socket.handshake.auth?.userId;

    if (!userId) {
      console.log("❌ No userId provided for chat socket");
      socket.disconnect(true);
      return;
    }

    socket.userId = userId;
    chatUserSockets.set(userId, socket.id);
    chatSocketToUser.set(socket.id, userId);
    socket.join(userId);

    console.log(`✅ Chat connected: user ${userId}, socket ${socket.id}`);
    socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
      try {
        console.log(`💬 ${senderId} → ${receiverId}: ${content}`);

        const msg = await prisma.message.create({
          data: { senderId, receiverId, content },
        });

        io.of("/friends").to(receiverId).emit("receiveMessage", msg);

        socket.to(senderId).emit("receiveMessage", msg);
        
        io.of("/friends").to(socket.id).emit("messageSent", msg);
      } catch (err) {
        console.error("❌ Error saving chat message:", err);
      }
    });
    socket.on("typing", ({ toUserId }) => {
      io.of("/friends").to(toUserId).emit("typing", { fromUserId: userId });
    });

    socket.on("stopTyping", ({ toUserId }) => {
      io.of("/friends").to(toUserId).emit("stopTyping", { fromUserId: userId });
    });
    socket.on("matchInvite", ({ fromUserId, fromUserName, toUserId }) => {
      console.log("🎯 matchInvite:", { fromUserId, fromUserName, toUserId });

      const receiverSocketId = chatUserSockets.get(toUserId);
      if (!receiverSocketId) {
        console.log("❌ Invite target offline");
        io.of("/friends")
          .to(socket.id)
          .emit("receiveMessage", {
            id: `sys-${Date.now()}`,
            senderId: fromUserId,
            receiverId: toUserId,
            content: "User is offline. Invite not delivered.",
            createdAt: new Date().toISOString(),
            type: "system",
          });
        return;
      }

      // Send invite message to receiver
      io.of("/friends")
        .to(receiverSocketId)
        .emit("receiveMessage", {
          id: `invite-${Date.now()}`,
          senderId: fromUserId,
          receiverId: toUserId,
          content: `${fromUserName} invited you to a 1v1 match.`,
          createdAt: new Date().toISOString(),
          type: "invite",
        });

      // Expiration after 30s
      setTimeout(() => {
        io.of("/friends")
          .to(receiverSocketId)
          .emit("receiveMessage", {
            id: `sys-${Date.now()}`,
            senderId: fromUserId,
            receiverId: toUserId,
            content: `The match invite from ${fromUserName} has expired.`,
            createdAt: new Date().toISOString(),
            type: "system",
          });
      }, 30000);
    });
    socket.on(
      "respondInvite",
      async ({
        fromUserId,
        accepted,
      }: {
        fromUserId: string;
        accepted: boolean;
      }) => {
        console.log("📩 respondInvite:", { fromUserId, accepted });

        const inviterSocketId = chatUserSockets.get(fromUserId);
        const accepterId = socket.userId!;
        if (!inviterSocketId) {
          console.log("⚠ inviter offline during response");
          return;
        }

        if (!accepted) {
          // Notify inviter only
          io.of("/friends")
            .to(inviterSocketId)
            .emit("receiveMessage", {
              id: `sys-${Date.now()}`,
              senderId: accepterId,
              receiverId: fromUserId,
              content: "Your match invite was declined.",
              createdAt: new Date().toISOString(),
              type: "system",
            });
          return;
        }

        try {
          // ✅ Create match on backend directly
          console.log("⚙ Creating match:", {
            requesterId: fromUserId,
            opponentId: accepterId,
          });

          // call service directly
          const match = await createManualMatch(fromUserId, accepterId);

          if (!match) {
            console.error("❌ Match creation failed (returned null)");
            io.of("/friends")
              .to(socket.id)
              .emit("receiveMessage", {
                id: `sys-${Date.now()}`,
                senderId: accepterId,
                receiverId: fromUserId,
                content: "Failed to create match. Please try again later.",
                createdAt: new Date().toISOString(),
                type: "system",
              });
            return;
          }

          const { matchId } = match;

          console.log(
            `🏁 Match created [${matchId}] between ${fromUserId} & ${accepterId}`
          );

          // Notify both clients via socket
          io.of("/friends")
            .to(inviterSocketId)
            .emit("matchStarted", { matchId });
          io.of("/friends").to(socket.id).emit("matchStarted", { matchId });

          // System confirmation messages
          const sysMsg = {
            id: `sys-${Date.now()}`,
            senderId: accepterId,
            receiverId: fromUserId,
            content: "Match created successfully! Redirecting...",
            createdAt: new Date().toISOString(),
            type: "system",
          };
          io.of("/friends").to(inviterSocketId).emit("receiveMessage", sysMsg);
          io.of("/friends").to(socket.id).emit("receiveMessage", sysMsg);
        } catch (err) {
          console.error("❌ Error in match creation:", err);
          io.of("/friends")
            .to(socket.id)
            .emit("receiveMessage", {
              id: `sys-${Date.now()}`,
              senderId: accepterId,
              receiverId: fromUserId,
              content: "Unexpected server error while creating match.",
              createdAt: new Date().toISOString(),
              type: "system",
            });
        }
      }
    );
    socket.on("disconnect", () => {
      const uId = chatSocketToUser.get(socket.id);
      if (uId) {
        chatUserSockets.delete(uId);
        chatSocketToUser.delete(socket.id);
        console.log(`🔌 Chat disconnected: ${uId} (${socket.id})`);
      }
    });
  });
}
