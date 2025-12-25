"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth";

export const useMatchMaker = () => {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  
  const [loading, setLoading] = useState(false);
  const [queued, setQueued] = useState(false);
  const socket = useSocket(userId || "");
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    const handleMatchStarted = (data: any) => {
      console.log("match_started → redirecting to", data.matchId);
      setLoading(false);
      setQueued(false);
      router.push(`/code/${data.matchId}`);
    };

    socket.on("match_started", handleMatchStarted);

    return () => {
      socket.off("match_started", handleMatchStarted);
    };
  }, [socket, router]);

  const startMatch = async () => {
    if (!userId) {
      router.push("/signin");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/match", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      console.log("Match API response:", data);

      if (data.status === "queued" || data.status === "already_queued") {
        setQueued(true);
        setLoading(false);
      } else if (data.status === "already_in_match" && data.matchId) {
        router.push(`/code/${data.matchId}`);
      }
    } catch (error) {
      console.error("Match error:", error);
      setLoading(false);
    }
  };

  const cancelMatch = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/match/cancel", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setQueued(false);
      }
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    startMatch,
    cancelMatch,
    loading,
    queued,
    userId
  };
};
