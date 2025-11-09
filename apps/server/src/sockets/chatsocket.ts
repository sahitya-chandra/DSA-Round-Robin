import { Server, Socket } from "socket.io";
import { chatUserSockets, chatSocketToUser } from "../utils/utils";
import prisma from "@repo/db";
import fetch from "node-fetch";

interface AuthSocket extends Socket {
  userId?: string;
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

    // ---- Send normal message ----
    socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
      try {
        console.log(`💬 ${senderId} → ${receiverId}: ${content}`);

        const msg = await prisma.message.create({
          data: { senderId, receiverId, content },
        });

        const receiverSocketId = chatUserSockets.get(receiverId);
        if (receiverSocketId) {
          io.of("/friends").to(receiverSocketId).emit("receiveMessage", msg);
        }

        io.of("/friends").to(socket.id).emit("messageSent", msg);
      } catch (err) {
        console.error("❌ Error saving chat message:", err);
      }
    });

    // ---- Typing indicators ----
    socket.on("typing", ({ toUserId }) => {
      const receiverSocketId = chatUserSockets.get(toUserId);
      if (receiverSocketId) {
        io.of("/friends")
          .to(receiverSocketId)
          .emit("typing", { fromUserId: userId });
      }
    });

    socket.on("stopTyping", ({ toUserId }) => {
      const receiverSocketId = chatUserSockets.get(toUserId);
      if (receiverSocketId) {
        io.of("/friends")
          .to(receiverSocketId)
          .emit("stopTyping", { fromUserId: userId });
      }
    });

    // ---- Match invite ----
    socket.on("matchInvite", ({ fromUserId, fromUserName, toUserId }) => {
      console.log("🎯 matchInvite:", { fromUserId, fromUserName, toUserId });

      const receiverSocketId = chatUserSockets.get(toUserId);
      if (!receiverSocketId) {
        console.log("❌ Invite target offline");
        io.of("/friends").to(socket.id).emit("receiveMessage", {
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
        io.of("/friends").to(receiverSocketId).emit("receiveMessage", {
          id: `sys-${Date.now()}`,
          senderId: fromUserId,
          receiverId: toUserId,
          content: `The match invite from ${fromUserName} has expired.`,
          createdAt: new Date().toISOString(),
          type: "system",
        });
      }, 30000);
    });

    // ---- Respond to invite (accept / decline) ----
    socket.on(
      "respondInvite",
      async ({ fromUserId, accepted }: { fromUserId: string; accepted: boolean }) => {
        console.log("📩 respondInvite:", { fromUserId, accepted });

        const inviterSocketId = chatUserSockets.get(fromUserId);
        const accepterId = socket.userId!;
        if (!inviterSocketId) {
          console.log("⚠ inviter offline during response");
          return;
        }

        if (!accepted) {
          // Notify inviter only
          io.of("/friends").to(inviterSocketId).emit("receiveMessage", {
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
          // ✅ Create match on backend once — central authority
          console.log("⚙ Creating match:", { requesterId: fromUserId, opponentId: accepterId });

          const res = await fetch("http://localhost:5000/api/match/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requesterId: fromUserId,
              opponentId: accepterId,
            }),
          });

          const data = await res.json();
          console.log("✅ Match creation response:", data);
          const matchId = data?.matchId;

          if (!res.ok || !matchId) {
            console.error("❌ Match creation failed:", data);
            io.of("/friends").to(socket.id).emit("receiveMessage", {
              id: `sys-${Date.now()}`,
              senderId: accepterId,
              receiverId: fromUserId,
              content: "Failed to create match. Please try again later.",
              createdAt: new Date().toISOString(),
              type: "system",
            });
            return;
          }

          console.log(`🏁 Match created [${matchId}] between ${fromUserId} & ${accepterId}`);

          // Notify both clients via socket
          io.of("/friends").to(inviterSocketId).emit("matchStarted", { matchId });
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
          io.of("/friends").to(socket.id).emit("receiveMessage", {
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

    // ---- Disconnect cleanup ----
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
