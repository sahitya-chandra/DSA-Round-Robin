"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useMatchStores } from "@/stores/useMatchStore";
import { useMatchStore } from "@/stores/matchStore";
import { toast } from "sonner";

export const useMatchListener = () => {
    const { data: session } = authClient.useSession();
    const userId = session?.user?.id;
    const socket = useSocket(userId || "");
    const router = useRouter();
    const { setLoading, setQueued, setMatchFound } = useMatchStores();
    const { setMatchData, setTiming } = useMatchStore.getState();

    useEffect(() => {
        if (!socket) return;

        const handleMatchStarted = (data: any) => {
            console.log("match_started → redirecting to", data.matchId);
            setMatchFound(true);
            setMatchData({
                matchId: data.matchId,
                opponentId: data.opponentId,
                questions: data.questions,
            });
            setTiming(data.startedAt, data.duration);

            toast.success("MATCH FOUND!", {
                description: "Redirecting to your coding arena...",
                duration: 2000,
                className: "font-minecraft border-2 border-primary"
            });

            router.push(`/code/${data.matchId}`);
            // setQueued(false)
        };

        socket.on("match_started", handleMatchStarted);

        return () => {
            socket.off("match_started", handleMatchStarted);
        };
    }, [socket, router, setLoading, setQueued, setMatchFound]);
};
