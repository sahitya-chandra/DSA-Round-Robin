import { useMatchStore } from "@/store/matchStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket(userId: string): Socket | null {
  const router = useRouter();
  const { setMatchData } = useMatchStore.getState();

  useEffect(() => {
    if (!userId) return;

    if (socket?.connected) {
      socket.emit("register", { userId });
      return;
    }

    socket = io("http://localhost:5000", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const onConnect = () => {
      const s = socket!;
      console.log("Connected:", s.id);
      s.emit("register", { userId });
    };

    const onMatchStarted = (data: any) => {
      console.log("Match started:", data);
      setMatchData({
        matchId: data.matchId,
        opponentId: data.opponentId,
        questions: data.questions,
      });
      router.push(`/code/${data.matchId}`);
    };

    socket.on("connect", onConnect);
    socket.on("match_started", onMatchStarted);
		socket.on("connect_error", (err) => console.log("Connect error:", err.message));

    return () => {
      if (socket) {
        socket.off("connect", onConnect);
        socket.off("match_started", onMatchStarted);
				socket.disconnect(); 
				socket = null;
      }
    };
  }, [userId, router]);

  return socket;
}