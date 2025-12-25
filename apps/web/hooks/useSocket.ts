import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useMatchStore } from "@/stores/matchStore";
import { useRouter } from "next/navigation";
import { useSubmissionsStore } from "@/stores/submissionStore";
import { useMatchProgressStore } from "@/stores/matchProgressStore";
import { useMatchResultStore } from "@/stores/matchResultStore";
import { useMatchStores } from "@/stores/useMatchStore";
import { API_BASE_URL } from "@/lib/api";

export function useSocket(userId: string, slug?: string) {
  const router = useRouter();
  const { setMatchData, setTiming, resetMatchData } = useMatchStore.getState();
  const { updateSubmission, resetSubmissions} = useSubmissionsStore.getState()
  const { markSolved, resetProgress } = useMatchProgressStore.getState();
  const { setResult } = useMatchResultStore.getState()
  const { setQueued } = useMatchStores();
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    const s = getSocket(userId);

    const onMatchStarted = (data: any) => {
      console.log("Match started:", data);
      setMatchData({
        matchId: data.matchId,
        opponentId: data.opponentId,
        questions: data.questions,
      });
      setTiming(data.startedAt, data.duration);
      router.push(`/code/${data.matchId}`);
      setQueued(false)
    };

    const onMatchReady = (data: { matchId: string; startedAt: string }) => {
      console.log("match:ready → Match is ready to start", data);
    };

    const onSubmissionResult = (data: any) => {
      console.log("submission_result:", data);
      updateSubmission(data)
      if(data.result.passed) {
        markSolved(data.questionId)
      }
    };

    const onOpponentPassed = (data: {
      matchId: string;
      opponentId: string;
      questionId: number;
    }) => {
      console.log(
        `opponent_submission_passed: Opponent ${data.opponentId} passed question ${data.questionId}`
      );
      markSolved(String(data.questionId), true)
    };

    const onMatchFinished = (data: {
      matchId: string;
      winnerId: string | null;
      reason?: string;
    }) => {
      console.log("match:finished →", data);
      setResult(data.winnerId, data.reason);

      resetSubmissions()
      resetProgress()
      resetMatchData()
    };

    const joinExistingMatch = async () => {
      if (!slug) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/match/getmatch/${slug}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data.matchId) {
          s.emit("join_match", { matchId: data.matchId });
          console.log("Rejoined match:", data.matchId);
        }
      } catch (err) {
        console.error("Failed to rejoin match:", err);
      }
    };

    const handleConnect = () => {
        console.log("Socket connected, rejoining match if any...");
        joinExistingMatch();
    };

    s.on("connect", handleConnect);
    s.on("match_started", onMatchStarted);
    s.on("match:ready", onMatchReady);
    s.on("submission_result", onSubmissionResult);
    s.on("opponent_submission_passed", onOpponentPassed);
    s.on("match:finished", onMatchFinished);
    s.on("connect_error", (err) => console.log("Connect error:", err.message));

     if (s.connected) {
      joinExistingMatch();
    }
    // return () => {
    //   s.off("match_started", onMatchStarted);
    //   s.off("match:ready", onMatchReady);
    //   s.off("submission_result", onSubmissionResult);
    //   s.off("opponent_submission_passed", onOpponentPassed);
    //   s.off("match:finished", onMatchFinished);
    // };
  }, [userId, router, slug]);

  return socket;
}
