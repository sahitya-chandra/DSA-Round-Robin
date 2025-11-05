import { Server, Socket } from "socket.io";
import { chatUserSockets, chatSocketToUser } from "../utils/utils";
import prisma from "@repo/db";

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

    socket.on("typing", ({ toUserId }) => {
      const receiverSocketId = chatUserSockets.get(toUserId);
      if (receiverSocketId) {
        io.of("/friends").to(receiverSocketId).emit("typing", { fromUserId: userId });
      }
    });

    socket.on("stopTyping", ({ toUserId }) => {
      const receiverSocketId = chatUserSockets.get(toUserId);
      if (receiverSocketId) {
        io.of("/friends").to(receiverSocketId).emit("stopTyping", { fromUserId: userId });
      }
    });

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
