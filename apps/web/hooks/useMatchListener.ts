"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useMatchStores } from "@/stores/useMatchStore";

export const useMatchListener = () => {
    const { data: session } = authClient.useSession();
    const userId = session?.user?.id;
    const socket = useSocket(userId || "");
    const router = useRouter();
    const { setLoading, setQueued } = useMatchStores();

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
    }, [socket, router, setLoading, setQueued]);
};
