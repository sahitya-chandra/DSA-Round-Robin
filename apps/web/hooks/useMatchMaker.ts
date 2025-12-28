"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useMatchStores } from "@/stores/useMatchStore";
import { API_BASE_URL } from "@/lib/api";

export const useMatchMaker = () => {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const router = useRouter();
  
  const { loading, queued, setLoading, setQueued } = useMatchStores();

  const startMatch = async () => {
    if (!userId) {
      router.push("/signin");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/match`, {
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
      const res = await fetch(`${API_BASE_URL}/api/match/cancel`, {
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
