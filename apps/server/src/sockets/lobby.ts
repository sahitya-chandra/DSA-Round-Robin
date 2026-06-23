import { Server, Socket } from "socket.io";
import { connection as redis } from "@repo/queue";
import { socketToUser, userSockets } from "../utils/utils";
import { USER_MATCH_PREFIX, LOBBY_MIN_PLAYERS } from "../utils/constants";
import {
  createLobby,
  joinLobby,
  leaveLobby,
  getLobby,
  markLobbyStarted,
  LobbyError,
  LobbyState,
} from "../helpers/lobby.helper";
import { createCustomMatch } from "../helpers/customMatch.helper";

type Ack = (response: any) => void;

const lobbyRoom = (code: string) => `lobby_room:${code}`;

function broadcastLobby(io: Server, state: LobbyState) {
  io.to(lobbyRoom(state.code)).emit("lobby:update", state);
}

/**
 * Registers custom-lobby socket handlers on a connected socket. Lobbies are
 * realtime (player list updates live), so everything runs over sockets with
 * ack callbacks for immediate request/response.
 */
export function registerLobbyHandlers(io: Server, socket: Socket) {
  socket.on(
    "lobby:create",
    async ({ maxPlayers, name }: { maxPlayers: number; name?: string }, ack?: Ack) => {
      const userId = socketToUser.get(socket.id);
      if (!userId) return ack?.({ ok: false, error: "UNAUTHENTICATED" });

      try {
        const activeMatch = await redis.get(`${USER_MATCH_PREFIX}${userId}`);
        if (activeMatch) {
          return ack?.({ ok: false, error: "IN_MATCH", matchId: activeMatch });
        }

        const state = await createLobby(userId, name || "Player", maxPlayers);
        socket.join(lobbyRoom(state.code));
        ack?.({ ok: true, lobby: state });
      } catch (err: any) {
        console.error("lobby:create error", err);
        ack?.({ ok: false, error: err?.code || "ERROR", message: err?.message });
      }
    }
  );

  socket.on(
    "lobby:join",
    async ({ code, name }: { code: string; name?: string }, ack?: Ack) => {
      const userId = socketToUser.get(socket.id);
      if (!userId) return ack?.({ ok: false, error: "UNAUTHENTICATED" });

      try {
        const activeMatch = await redis.get(`${USER_MATCH_PREFIX}${userId}`);
        if (activeMatch) {
          return ack?.({ ok: false, error: "IN_MATCH", matchId: activeMatch });
        }

        const state = await joinLobby(code, userId, name || "Player");
        socket.join(lobbyRoom(state.code));
        broadcastLobby(io, state);
        ack?.({ ok: true, lobby: state });
      } catch (err: any) {
        if (err instanceof LobbyError) {
          return ack?.({ ok: false, error: err.code, message: err.message });
        }
        console.error("lobby:join error", err);
        ack?.({ ok: false, error: "ERROR", message: err?.message });
      }
    }
  );

  // Fetch current state (used on page load / reconnect) and (re)join the room.
  socket.on("lobby:state", async ({ code }: { code: string }, ack?: Ack) => {
    try {
      const state = await getLobby(code);
      if (state) socket.join(lobbyRoom(state.code));
      ack?.({ ok: !!state, lobby: state });
    } catch (err: any) {
      ack?.({ ok: false, error: "ERROR", message: err?.message });
    }
  });

  socket.on("lobby:leave", async ({ code }: { code: string }, ack?: Ack) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return ack?.({ ok: false, error: "UNAUTHENTICATED" });

    try {
      const state = await leaveLobby(code, userId);
      socket.leave(lobbyRoom((code || "").toUpperCase()));
      if (state) {
        broadcastLobby(io, state);
      } else {
        io.to(lobbyRoom((code || "").toUpperCase())).emit("lobby:closed", { code });
      }
      ack?.({ ok: true });
    } catch (err: any) {
      console.error("lobby:leave error", err);
      ack?.({ ok: false, error: "ERROR", message: err?.message });
    }
  });

  socket.on("lobby:start", async ({ code }: { code: string }, ack?: Ack) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return ack?.({ ok: false, error: "UNAUTHENTICATED" });

    try {
      const state = await getLobby(code);
      if (!state) return ack?.({ ok: false, error: "NOT_FOUND" });
      if (state.hostId !== userId)
        return ack?.({ ok: false, error: "NOT_HOST", message: "Only the host can start" });
      if (state.status !== "WAITING")
        return ack?.({ ok: false, error: "ALREADY_STARTED" });
      if (state.players.length < LOBBY_MIN_PLAYERS)
        return ack?.({
          ok: false,
          error: "NOT_ENOUGH_PLAYERS",
          message: `Need at least ${LOBBY_MIN_PLAYERS} players`,
        });

      const match = await createCustomMatch(
        state.players.map((p) => ({ id: p.id, name: p.name })),
        state.hostId
      );

      if (!match) {
        return ack?.({
          ok: false,
          error: "CREATE_FAILED",
          message: "Could not start the match (a player may already be in a game)",
        });
      }

      await markLobbyStarted(state.code, match.matchId);

      const { matchId, questions, startedAt, duration, participants } = match;

      // Join every connected participant's socket into the match room.
      for (const p of participants) {
        const sid = userSockets.get(p.id);
        const psock = sid ? io.sockets.sockets.get(sid) : null;
        psock?.join(matchId);
      }

      io.to(matchId).emit("match:ready", { matchId, startedAt });

      // Notify the lobby room that the match is starting.
      io.to(lobbyRoom(state.code)).emit("lobby:started", { matchId });

      // Send each participant their personalized match_started payload.
      for (const p of participants) {
        const opponent = participants.find((o) => o.id !== p.id);
        io.to(p.id).emit("match_started", {
          matchId,
          opponentId: opponent?.id ?? "",
          questions,
          startedAt,
          duration,
          mode: "custom",
          participants,
        });
      }

      ack?.({ ok: true, matchId });
    } catch (err: any) {
      console.error("lobby:start error", err);
      ack?.({ ok: false, error: "ERROR", message: err?.message });
    }
  });
}

/**
 * Cleanup helper invoked on socket disconnect: removes the user from any lobby
 * they were in and notifies the rest of the room.
 */
export async function handleLobbyDisconnect(io: Server, userId: string) {
  try {
    const code = await redis.get(`user_lobby:${userId}`);
    if (!code) return;
    const state = await leaveLobby(code, userId);
    if (state) {
      io.to(lobbyRoom(state.code)).emit("lobby:update", state);
    } else {
      io.to(lobbyRoom(code.toUpperCase())).emit("lobby:closed", { code });
    }
  } catch (err) {
    console.error("handleLobbyDisconnect error", err);
  }
}
