"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";

export const Btn = ({ userId }: { userId: string | undefined }) => {
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

  const match = async () => {
    if (!userId) return;
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

  const cancel = async () => {
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

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex space-x-2">
        <Button onClick={match} disabled={loading || queued}>
          {queued ? "Searching..." : "Start Match"}
        </Button>
        {queued && (
          <Button variant="ghost" onClick={cancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>

      {queued && (
        <div className="text-gray-400 text-sm animate-pulse">
          Waiting for opponent...
        </div>
      )}
    </div>
  );
};