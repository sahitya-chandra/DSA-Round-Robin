import { connection as redis } from "@repo/queue";
import prisma from "@repo/db";
import { finishMatchById } from "../helpers/finishMatch.helper";
import {
  ACTIVE_MATCH_PREFIX,
  USER_MATCH_PREFIX,
  WAITING_LIST,
} from "../utils/constants";
import {
  createMatch as createMatchHelper,
  CreatedMatch,
} from "../helpers/matchMaker.helper";

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

    if (raw.requesterId !== userId && raw.opponentId !== userId) {
      const err: any = new Error("not a participant");
      err.code = "FORBIDDEN";
      throw err;
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

    if (data.requesterId !== userId && data.opponentId !== userId) {
      const err: any = new Error("forbidden");
      err.code = "FORBIDDEN";
      throw err;
    }

    const questions = data.questions ? JSON.parse(data.questions) : [];

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


