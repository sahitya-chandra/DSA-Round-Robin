import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket: Socket | null = null;

export function getSocket(userId: string): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ["websocket"],
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
