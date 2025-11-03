import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(userId: string): Socket {
  if (!socket) {
    socket = io("http://localhost:5000", {
      withCredentials: true,
			reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
      socket?.emit("register", { userId });
    });
  }

  return socket;
}
