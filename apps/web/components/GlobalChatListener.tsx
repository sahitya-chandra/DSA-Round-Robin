"use client";
import React, { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL } from "@/lib/api";
import { useFriendsListStore } from "@/stores/friendsListStore";
import { usePathname } from "next/navigation";

export const GlobalChatListener = () => {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const socketRef = useRef<Socket | null>(null);
  const { incrementUnread } = useFriendsListStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(`${API_BASE_URL}/friends`, {
      auth: { userId },
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("GlobalChatListener: Connected to /friends");
    });

    socketRef.current.on("receiveMessage", (msg: any) => {
      console.log("GlobalChatListener: Received message", msg);
      // If we are sender, don't increment (obviously)
      if (msg.senderId === userId) {
         console.log("GlobalChatListener: Ignoring own message");
         return;
      }
      
      console.log(`GlobalChatListener: Incrementing unread for ${msg.senderId}`);
      incrementUnread(msg.senderId);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId, incrementUnread]);

  return null;
};
