import { Server, Socket } from "socket.io";
import prisma from "@repo/db"; // adjust import as needed

interface AuthSocket extends Socket {
  userId?: string;
}

const userSockets = new Map<string, string>(); // userId -> socket.id

export function setupSockets(io: Server) {
  io.on("connection", (socket: AuthSocket) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) {
      console.log("❌ No userId provided, disconnecting socket");
      socket.disconnect();
      return;
    }

    socket.userId = userId;
    userSockets.set(userId, socket.id);
    console.log(`✅ User ${userId} connected with socket ${socket.id}`);

    // 📨 Listen for messages
    socket.on("sendMessage", async (data) => {
      const { senderId, receiverId, content } = data;
      console.log(`💬 Message from ${senderId} -> ${receiverId}: ${content}`);

      // Save to DB
      try {
        const msg = await prisma.message.create({
          data: { senderId, receiverId, content },
        });

        // Send message to receiver if online
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", msg);
        }

        // Also emit back to sender for confirmation
        // socket.emit("receiveMessage", msg);
      } catch (err) {
        console.error("❌ Error saving message:", err);
      }
    });

    // ✍️ Typing indicator
    socket.on("typing", ({ toUserId }) => {
      const receiverSocketId = userSockets.get(toUserId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { fromUserId: userId });
      }
    });

    socket.on("stopTyping", ({ toUserId }) => {
      const receiverSocketId = userSockets.get(toUserId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", { fromUserId: userId });
      }
    });

    // ❌ Handle disconnect
    socket.on("disconnect", () => {
      userSockets.delete(userId);
      console.log(`🚪 User ${userId} disconnected`);
    });
  });
}
