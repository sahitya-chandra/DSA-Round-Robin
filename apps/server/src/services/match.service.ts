import { connection as redis } from "@repo/queue";
import prisma from "@repo/db";
import { finishMatchById } from "../helpers/finishMatch.helper";
import {
  ACTIVE_MATCH_PREFIX,
  USER_MATCH_PREFIX,
  SUBMISSIONS_PREFIX,
  WAITING_LIST,
} from "../utils/constants";
import {
  createMatch as createMatchHelper,
  CreatedMatch,
} from "../helpers/matchMaker.helper";
import {
  getParticipantIds,
  getCustomParticipants,
  MatchPlayer,
} from "../helpers/participants.helper";
import { getIo } from "../utils/socketInstance";

export type QueueStatus =
  | { status: "already_in_match"; matchId: string }
  | { status: "already_queued" }
  | { status: "queued" };

export async function queueUserForMatch(
  userId: string
): Promise<QueueStatus> {
  try {
    const activeMatch = await redis.get(`${USER_MATCH_PREFIX}${userId}`);
    if (activeMatch) {
      return { status: "already_in_match", matchId: activeMatch };
    }

    const LUA_ADD_IF_NOT_EXISTS = `
      if redis.call('lpos', KEYS[1], ARGV[1]) == false then
        redis.call('lpush', KEYS[1], ARGV[1])
        return 1
      end
      return 0
    `;

    const added = await redis.eval(
      LUA_ADD_IF_NOT_EXISTS,
      1,
      WAITING_LIST,
      userId
    );

    if (added === 0) {
      return { status: "already_queued" };
    }

    return { status: "queued" };
  } catch (err) {
    console.error("queueUserForMatch error:", err);
    throw new Error("internal_error");
  }
}

export async function cancelQueuedMatch(userId: string): Promise<void> {
  await redis.lrem(WAITING_LIST, 0, userId);
}

export async function finishMatchForUser(
  matchId: string,
  userId: string
): Promise<void> {
  try {
    const raw = await redis.hgetall(`${ACTIVE_MATCH_PREFIX}${matchId}`);
    
    if (!raw || Object.keys(raw).length === 0) {
      const dbMatch = await prisma.match.findUnique({
        where: { id: matchId },
        include: { participants: true }
      });

      if (dbMatch && dbMatch.status === "FINISHED") {
        const isParticipant = dbMatch.participants.some(p => p.userId === userId);
        if (isParticipant) {
          return;
        }
      }
      
      const err: any = new Error("not a participant or match not found");
      err.code = "FORBIDDEN";
      throw err;
    }

    if (!getParticipantIds(raw).includes(userId)) {
      const err: any = new Error("not a participant");
      err.code = "FORBIDDEN";
      throw err;
    }

    // Custom (N-player) match: "give up" forfeits just this player.
    if (raw.mode === "custom") {
      await forfeitCustomMatch(matchId, userId, raw);
      return;
    }

    const winnerId =
      raw.opponentId === userId ? raw.requesterId : raw.opponentId;
    await finishMatchById(matchId, { winnerId });
  } catch (err: any) {
    if (err.code === "FORBIDDEN") {
      throw err;
    }
    console.error("finishMatchForUser error:", err);
    throw new Error("internal_error");
  }
}

export interface MatchView {
  matchId: string;
  requesterId: string;
  opponentId: string;
  status: string;
  startedAt: string;
  duration: string;
  questions: any[];
  opponent?: { id: string; name: string };
  mode?: "custom";
  hostId?: string;
  participants?: MatchPlayer[];
}

/**
 * Forfeits a single player in a custom match. If fewer than 2 players remain
 * afterwards, the whole match is finished; otherwise the leaver is removed and
 * the remaining players keep playing.
 */
export async function forfeitCustomMatch(
  matchId: string,
  userId: string,
  raw: Record<string, string>
): Promise<void> {
  const participants = getCustomParticipants(raw);
  const remaining = participants.filter((p) => p.id !== userId);

  // Persist the reduced participant list so finish/scoring ignores the leaver.
  await redis.hset(
    `${ACTIVE_MATCH_PREFIX}${matchId}`,
    "participants",
    JSON.stringify(remaining)
  );

  // Release the leaver's match/submission state.
  await redis.del(`${USER_MATCH_PREFIX}${userId}`);
  await redis.del(`${SUBMISSIONS_PREFIX}${matchId}:${userId}`);

  if (remaining.length < 2) {
    // Not enough players to continue — end the match.
    await finishMatchById(matchId);
  } else {
    // Tell the remaining players that someone left.
    try {
      getIo().to(matchId).emit("participant_left", { matchId, userId });
    } catch (e) {
      console.error("Failed to emit participant_left:", e);
    }
  }

  // Send the leaver to the results screen.
  try {
    getIo()
      .to(userId)
      .emit("match:finished", { matchId, winnerId: null, reason: "forfeit" });
  } catch (e) {
    console.error("Failed to emit forfeit match:finished:", e);
  }
}

export async function getActiveMatchForUser(
  userId: string
): Promise<MatchView> {
  const activeMatchId = await redis.get(`${USER_MATCH_PREFIX}${userId}`);
  if (!activeMatchId) {
    const err: any = new Error("no active match found");
    err.code = "NOT_FOUND";
    throw err;
  }
  return getMatchForUser(activeMatchId, userId);
}

export async function getMatchForUser(
  matchId: string,
  userId: string
): Promise<MatchView> {
  try {
    const matchKey = `${ACTIVE_MATCH_PREFIX}${matchId}`;
    const data = await redis.hgetall(matchKey);

    if (!data || !data.status) {
      const err: any = new Error("not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    if (data.status !== "RUNNING") {
      const err: any = new Error("match ended");
      err.code = "NOT_RUNNING";
      throw err;
    }

    if (!getParticipantIds(data).includes(userId)) {
      const err: any = new Error("forbidden");
      err.code = "FORBIDDEN";
      throw err;
    }

    const questions = data.questions ? JSON.parse(data.questions) : [];

    // Custom N-player match: derive opponent info from the stored participants.
    if (data.mode === "custom") {
      const participants = getCustomParticipants(data);
      const others = participants.filter((p) => p.id !== userId);
      const firstOther = others[0];

      return {
        matchId,
        requesterId: data.hostId ?? userId,
        opponentId: firstOther?.id ?? "",
        status: data.status,
        startedAt: data.startedAt!,
        duration: data.duration!,
        questions,
        opponent: firstOther
          ? { id: firstOther.id, name: firstOther.name }
          : undefined,
        mode: "custom",
        hostId: data.hostId,
        participants,
      };
    }

    const actualOpponentId = data.requesterId === userId ? data.opponentId : data.requesterId;
    const opponentUser = await prisma.user.findUnique({
      where: { id: actualOpponentId! },
      select: { id: true, name: true },
    });

    return {
      matchId,
      requesterId: data.requesterId!,
      opponentId: data.opponentId!,
      status: data.status,
      startedAt: data.startedAt!,
      duration: data.duration!,
      questions,
      opponent: opponentUser ? { id: opponentUser.id, name: opponentUser.name } : undefined,
    };
  } catch (err: any) {
    if (["NOT_FOUND", "NOT_RUNNING", "FORBIDDEN"].includes(err.code)) {
      throw err;
    }
    console.error("getMatchForUser error:", err);
    throw new Error("internal_error");
  }
}

export async function createManualMatch(
  requesterId: string,
  opponentId: string
): Promise<CreatedMatch> {
  const match = await createMatchHelper(requesterId, opponentId);
  if (match) return match;

  const matchId = `${Date.now()}:${requesterId}:${opponentId}`;
  const matchKey = `${ACTIVE_MATCH_PREFIX}${matchId}`;
  const matchData = {
    requesterId,
    opponentId,
    status: "RUNNING",
    startedAt: new Date().toISOString(),
    duration: "600",
  };

  await redis.hmset(matchKey, matchData);
  await redis.set(`${USER_MATCH_PREFIX}${requesterId}`, matchId);
  await redis.set(`${USER_MATCH_PREFIX}${opponentId}`, matchId);

  return {
    matchId,
    requesterId,
    opponentId,
    questions: [],
    startedAt: matchData.startedAt,
    expiresAt: matchData.startedAt,
    duration: Number(matchData.duration),
  };
}


