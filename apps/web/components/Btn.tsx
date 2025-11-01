"use client"
import { useEffect, useState } from "react";
import { Button } from "./ui/button"
import { useSocket } from "@/hooks/useSocket"

export const Btn = ({userId}: {userId: string | undefined}) => {
  const [loading, setLoading] = useState(false);
  const [queued, setQueued] = useState(false);
  const socket = useSocket(userId || "")

  useEffect(() => {
    if (!socket) return;

    const handleMatchStarted = () => {
      setLoading(false);
      setQueued(false);
    };

    socket.on("match_started", handleMatchStarted);

    return () => {
      socket.off("match_started", handleMatchStarted);
    };
  }, [socket]);

  const match = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/match", {
        method: "POST",
        credentials: 'include'
      });

      const data = await res.json();
      console.log("Response data:", data);

      if (data.status === "queued" || data.status === "already_queued") {
        setQueued(true);
      } else if (data.status === "already_in_match" && data.matchId) {
        window.location.href = `/code/${data.matchId}`;
      }
    } catch (error) {
      console.error("Match error:", error);
      setLoading(false);
    }
  }

  const cancel = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/match/cancel", {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setQueued(false);
      }
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex space-x-2">
        <Button onClick={match} disabled={loading || queued}>
          {queued ? "Searching for opponent..." : "Start Match"}
        </Button>
        {queued && (
          <Button variant="ghost" onClick={cancel}>
            Cancel
          </Button>
        )}
      </div>

      {queued && (
        <div className="text-gray-400 text-sm animate-pulse">
          Waiting for another player to join...
        </div>
      )}
    </div>
  )
}
