"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { authClient } from "@/lib/auth-client";
import { useLobbyStore, LobbyState } from "@/stores/lobbyStore";

interface LobbyResponse {
  ok: boolean;
  lobby?: LobbyState;
  matchId?: string;
  error?: string;
  message?: string;
}

const errorMessage = (resp: LobbyResponse, fallback: string) => {
  if (resp.message) return resp.message;
  switch (resp.error) {
    case "NOT_FOUND":
      return "Room not found. Check the code and try again.";
    case "FULL":
      return "That room is already full.";
    case "NOT_JOINABLE":
      return "That room has already started.";
    case "IN_MATCH":
      return "You're already in a match.";
    case "UNAUTHENTICATED":
      return "Please sign in first.";
    default:
      return fallback;
  }
};

/**
 * Hook exposing custom-lobby actions over the shared socket. Optionally wires
 * up live lobby listeners for the waiting-room page (pass `listen: true`).
 */
export function useLobby(options: { listen?: boolean } = {}) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Player";
  const router = useRouter();
  const { lobby, setLobby, clearLobby } = useLobbyStore();

  const emit = useCallback(
    <T = LobbyResponse>(event: string, payload: any): Promise<T> => {
      return new Promise((resolve) => {
        if (!userId) {
          resolve({ ok: false, error: "UNAUTHENTICATED" } as T);
          return;
        }
        const socket = getSocket(userId);
        socket.emit(event, payload, (resp: T) => resolve(resp));
      });
    },
    [userId]
  );

  const createRoom = useCallback(
    async (maxPlayers: number) => {
      const resp = await emit("lobby:create", { maxPlayers, name: userName });
      if (resp.ok && resp.lobby) {
        setLobby(resp.lobby);
        router.push(`/lobby/${resp.lobby.code}`);
        return resp.lobby;
      }
      toast.error(errorMessage(resp, "Could not create room"));
      return null;
    },
    [emit, userName, setLobby, router]
  );

  const joinRoom = useCallback(
    async (code: string) => {
      const clean = code.trim().toUpperCase();
      if (!clean) {
        toast.error("Enter a room code");
        return null;
      }
      const resp = await emit("lobby:join", { code: clean, name: userName });
      if (resp.ok && resp.lobby) {
        setLobby(resp.lobby);
        router.push(`/lobby/${resp.lobby.code}`);
        return resp.lobby;
      }
      toast.error(errorMessage(resp, "Could not join room"));
      return null;
    },
    [emit, userName, setLobby, router]
  );

  const fetchState = useCallback(
    async (code: string) => {
      const resp = await emit("lobby:state", { code });
      if (resp.ok && resp.lobby) {
        setLobby(resp.lobby);
        return resp.lobby;
      }
      return null;
    },
    [emit, setLobby]
  );

  const leaveRoom = useCallback(
    async (code: string) => {
      await emit("lobby:leave", { code });
      clearLobby();
    },
    [emit, clearLobby]
  );

  const startRoom = useCallback(
    async (code: string) => {
      const resp = await emit("lobby:start", { code });
      if (!resp.ok) {
        toast.error(errorMessage(resp, "Could not start the match"));
      }
      return resp;
    },
    [emit]
  );

  // Live updates for the waiting-room page.
  useEffect(() => {
    if (!options.listen || !userId) return;
    const socket = getSocket(userId);

    const onUpdate = (state: LobbyState) => setLobby(state);
    const onClosed = () => {
      clearLobby();
      toast.message("Room closed");
      router.replace("/compete");
    };
    const onStarted = () => {
      toast.success("Match starting!", { duration: 1500 });
      // Navigation into /code is handled by the global match_started listener.
    };

    socket.on("lobby:update", onUpdate);
    socket.on("lobby:closed", onClosed);
    socket.on("lobby:started", onStarted);

    return () => {
      socket.off("lobby:update", onUpdate);
      socket.off("lobby:closed", onClosed);
      socket.off("lobby:started", onStarted);
    };
  }, [options.listen, userId, setLobby, clearLobby, router]);

  return {
    lobby,
    userId,
    createRoom,
    joinRoom,
    fetchState,
    leaveRoom,
    startRoom,
  };
}
