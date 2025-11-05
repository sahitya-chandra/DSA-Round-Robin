import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useMatchStore } from "@/store/matchStore";
import { useRouter } from "next/navigation";
import { useSubmissionsStore } from "@/store/submissionStore";

export function useSocket(userId: string) {
  const router = useRouter();
  const { setMatchData } = useMatchStore.getState();
  const { updateSubmission, resetSubmissions} = useSubmissionsStore.getState()
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
      router.push(`/code/${data.matchId}`);
    };

    const onMatchReady = (data: { matchId: string; startedAt: string }) => {
      console.log("match:ready → Match is ready to start", data);
      // Optional: show "Match starting in 3...2...1"
    };

    const onSubmissionResult = (data: any) => {
      console.log("submission_result:", data);
      updateSubmission(data)
    };

    const onOpponentPassed = (data: {
      matchId: string;
      opponentId: string;
      questionId: number;
    }) => {
      console.log(
        `opponent_submission_passed: Opponent ${data.opponentId} passed question ${data.questionId}`
      );
    };

    const onMatchFinished = (data: {
      matchId: string;
      winnerId: string | null;
      reason?: string;
    }) => {
      console.log("match:finished →", data);
      alert(
        data.winnerId === userId
          ? "You won!"
          : data.winnerId
          ? "You lost!"
          : "Match ended in a draw!"
      );
      if (data.reason) {
        console.log("Reason:", data.reason);
      }
      resetSubmissions()
      router.push("/");
    };

    s.on("match_started", onMatchStarted);
    s.on("match:ready", onMatchReady);
    s.on("submission_result", onSubmissionResult);
    s.on("opponent_submission_passed", onOpponentPassed);
    s.on("match:finished", onMatchFinished);
    s.on("connect_error", (err) => console.log("Connect error:", err.message));

    // return () => {
    //   s.off("match_started", onMatchStarted);
    //   s.off("match:ready", onMatchReady);
    //   s.off("submission_result", onSubmissionResult);
    //   s.off("opponent_submission_passed", onOpponentPassed);
    //   s.off("match:finished", onMatchFinished);
    // };
  }, [userId, router]);

  return socket;
}
