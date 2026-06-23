import { connection as redis } from "@repo/queue";
import {
  LOBBY_PREFIX,
  LOBBY_PLAYERS_SUFFIX,
  USER_LOBBY_PREFIX,
  LOBBY_TTL,
  LOBBY_MIN_PLAYERS,
  LOBBY_MAX_PLAYERS,
} from "../utils/constants";

export interface LobbyPlayer {
  id: string;
  name: string;
  joinedAt: string;
}

export type LobbyStatus = "WAITING" | "STARTED" | "CLOSED";

export interface LobbyState {
  code: string;
  hostId: string;
  maxPlayers: number;
  minPlayers: number;
  status: LobbyStatus;
  createdAt: string;
  matchId?: string;
  players: LobbyPlayer[];
}

export class LobbyError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// Excludes ambiguous chars (0/O, 1/I/L) so codes are easy to read & share.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

const lobbyKey = (code: string) => `${LOBBY_PREFIX}${code}`;
const playersKey = (code: string) => `${LOBBY_PREFIX}${code}${LOBBY_PLAYERS_SUFFIX}`;
const userLobbyKey = (userId: string) => `${USER_LOBBY_PREFIX}${userId}`;

export async function getLobby(code: string): Promise<LobbyState | null> {
  if (!code) return null;
  const normalized = code.toUpperCase();
  const hash = await redis.hgetall(lobbyKey(normalized));
  if (!hash || !hash.code) return null;

  const playersHash = await redis.hgetall(playersKey(normalized));
  const players: LobbyPlayer[] = Object.values(playersHash || {})
    .map((p) => {
      try {
        return JSON.parse(p) as LobbyPlayer;
      } catch {
        return null;
      }
    })
    .filter((p): p is LobbyPlayer => !!p)
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

  return {
    code: hash.code,
    hostId: hash.hostId!,
    maxPlayers: Number(hash.maxPlayers),
    minPlayers: LOBBY_MIN_PLAYERS,
    status: (hash.status as LobbyStatus) || "WAITING",
    createdAt: hash.createdAt!,
    matchId: hash.matchId || undefined,
    players,
  };
}

export async function getUserLobbyCode(userId: string): Promise<string | null> {
  return redis.get(userLobbyKey(userId));
}

export async function createLobby(
  hostId: string,
  hostName: string,
  maxPlayers: number
): Promise<LobbyState> {
  // A user can only host/be in one lobby; drop any stale membership first.
  const existing = await getUserLobbyCode(hostId);
  if (existing) {
    await leaveLobby(existing, hostId).catch(() => {});
  }

  const max = Math.min(
    Math.max(LOBBY_MIN_PLAYERS, Math.floor(maxPlayers) || LOBBY_MIN_PLAYERS),
    LOBBY_MAX_PLAYERS
  );

  let code = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = randomCode();
    const exists = await redis.exists(lobbyKey(candidate));
    if (!exists) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new LobbyError("CODE_GEN_FAILED", "Could not allocate a room code");

  const createdAt = new Date().toISOString();
  const hostPlayer: LobbyPlayer = { id: hostId, name: hostName, joinedAt: createdAt };

  await redis
    .multi()
    .hmset(
      lobbyKey(code),
      "code",
      code,
      "hostId",
      hostId,
      "maxPlayers",
      String(max),
      "status",
      "WAITING",
      "createdAt",
      createdAt
    )
    .expire(lobbyKey(code), LOBBY_TTL)
    .hset(playersKey(code), hostId, JSON.stringify(hostPlayer))
    .expire(playersKey(code), LOBBY_TTL)
    .set(userLobbyKey(hostId), code, "EX", LOBBY_TTL)
    .exec();

  return (await getLobby(code))!;
}

export async function joinLobby(
  code: string,
  userId: string,
  userName: string
): Promise<LobbyState> {
  const normalized = (code || "").toUpperCase();
  const lobby = await getLobby(normalized);

  if (!lobby) throw new LobbyError("NOT_FOUND", "Room not found");
  if (lobby.status !== "WAITING")
    throw new LobbyError("NOT_JOINABLE", "This room has already started");

  const already = lobby.players.find((p) => p.id === userId);
  if (already) {
    // Idempotent re-join (e.g. refresh / reconnect).
    await redis.set(userLobbyKey(userId), normalized, "EX", LOBBY_TTL);
    return lobby;
  }

  if (lobby.players.length >= lobby.maxPlayers)
    throw new LobbyError("FULL", "This room is full");

  // If the user was in another lobby, leave it first.
  const existing = await getUserLobbyCode(userId);
  if (existing && existing !== normalized) {
    await leaveLobby(existing, userId).catch(() => {});
  }

  const player: LobbyPlayer = {
    id: userId,
    name: userName,
    joinedAt: new Date().toISOString(),
  };

  await redis
    .multi()
    .hset(playersKey(normalized), userId, JSON.stringify(player))
    .expire(playersKey(normalized), LOBBY_TTL)
    .expire(lobbyKey(normalized), LOBBY_TTL)
    .set(userLobbyKey(userId), normalized, "EX", LOBBY_TTL)
    .exec();

  // Re-check capacity in case of a race; if we overflowed, roll back.
  const updated = await getLobby(normalized);
  if (updated && updated.players.length > updated.maxPlayers) {
    await redis.hdel(playersKey(normalized), userId);
    await redis.del(userLobbyKey(userId));
    throw new LobbyError("FULL", "This room is full");
  }

  return updated!;
}

/**
 * Removes a player from a lobby. Returns the updated lobby, or null if the
 * lobby was closed as a result (last player left, or it no longer exists).
 */
export async function leaveLobby(
  code: string,
  userId: string
): Promise<LobbyState | null> {
  const normalized = (code || "").toUpperCase();
  const lobby = await getLobby(normalized);

  // Always clear this user's reverse index.
  const currentCode = await getUserLobbyCode(userId);
  if (currentCode === normalized || !lobby) {
    await redis.del(userLobbyKey(userId));
  }

  if (!lobby) return null;

  await redis.hdel(playersKey(normalized), userId);
  const remaining = lobby.players.filter((p) => p.id !== userId);

  if (remaining.length === 0) {
    await closeLobby(normalized);
    return null;
  }

  // Reassign host to the earliest-joined remaining player if needed.
  if (lobby.hostId === userId) {
    const newHost = remaining[0]!;
    await redis.hset(lobbyKey(normalized), "hostId", newHost.id);
  }

  return getLobby(normalized);
}

export async function closeLobby(code: string): Promise<void> {
  const normalized = (code || "").toUpperCase();
  const lobby = await getLobby(normalized);
  if (lobby) {
    for (const p of lobby.players) {
      const current = await getUserLobbyCode(p.id);
      if (current === normalized) await redis.del(userLobbyKey(p.id));
    }
  }
  await redis.del(lobbyKey(normalized));
  await redis.del(playersKey(normalized));
}

/**
 * Marks a lobby as started and records its matchId. Clears the per-user lobby
 * index so players are free to be placed into the match. The lobby hash itself
 * is left to expire via TTL (lets late socket fetches still resolve it).
 */
export async function markLobbyStarted(code: string, matchId: string): Promise<void> {
  const normalized = (code || "").toUpperCase();
  const lobby = await getLobby(normalized);
  await redis.hmset(lobbyKey(normalized), "status", "STARTED", "matchId", matchId);
  if (lobby) {
    for (const p of lobby.players) {
      const current = await getUserLobbyCode(p.id);
      if (current === normalized) await redis.del(userLobbyKey(p.id));
    }
  }
}
