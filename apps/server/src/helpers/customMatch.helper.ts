import { v4 as uuidv4 } from "uuid";
import prisma from "@repo/db";
import type { Question } from "@repo/db";
import { connection as redis } from "@repo/queue";
import { expirationManager } from "../utils/ExpirationManager";
import { workerManager } from "../utils/WorkerManager";
import {
  ACTIVE_MATCH_PREFIX,
  USER_MATCH_PREFIX,
  MATCH_DURATION_SECONDS,
  MATCH_TTL,
  MATCH_EXPIRATIONS_KEY,
} from "../utils/constants";
import type { MatchPlayer } from "./participants.helper";

export interface CreatedCustomMatch {
  matchId: string;
  hostId: string;
  participants: MatchPlayer[];
  questions: {
    questionData: Question;
    order: number;
  }[];
  startedAt: string;
  expiresAt: string;
  duration: number;
}

/**
 * Creates an N-player "custom" match for a lobby. Mirrors createMatch() but
 * stores a participants array (mode === "custom") instead of requester/opponent,
 * and reserves a user_match key for every participant atomically.
 */
export async function createCustomMatch(
  players: MatchPlayer[],
  hostId: string,
  opts: { duration?: number; questionCount?: number } = {}
): Promise<CreatedCustomMatch | null> {
  const uniquePlayers = players.filter(
    (p, i) => players.findIndex((o) => o.id === p.id) === i
  );
  if (uniquePlayers.length < 2) return null;

  const duration = opts.duration ?? MATCH_DURATION_SECONDS;
  const questionCount = opts.questionCount ?? 5;
  const matchId = `custom:${uuidv4()}`;
  const lockKey = `${matchId}:lock`;

  const lock = await redis.set(lockKey, "1", "PX", 5000, "NX");
  if (!lock) return null;

  const reserved: string[] = [];

  try {
    // Reserve a user_match key for each player; bail (and roll back) if any
    // player is already in a match.
    for (const p of uniquePlayers) {
      const ok = await redis.set(
        `${USER_MATCH_PREFIX}${p.id}`,
        matchId,
        "EX",
        MATCH_TTL,
        "NX"
      );
      if (ok !== "OK") {
        for (const id of reserved) await redis.del(`${USER_MATCH_PREFIX}${id}`);
        return null;
      }
      reserved.push(p.id);
    }

    const questions = await prisma.$queryRaw<Question[]>`
      SELECT * FROM "Question"
      ORDER BY RANDOM()
      LIMIT ${questionCount}
    `;

    if (!questions || questions.length === 0) {
      throw new Error("No questions found");
    }

    const questionPayload = questions.map((q, i) => ({
      questionData: q,
      order: i + 1,
    }));

    const startedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + duration * 1000).toISOString();

    await redis
      .multi()
      .hmset(
        `${ACTIVE_MATCH_PREFIX}${matchId}`,
        "status",
        "RUNNING",
        "mode",
        "custom",
        "hostId",
        hostId,
        "participants",
        JSON.stringify(uniquePlayers),
        "questions",
        JSON.stringify(questionPayload),
        "startedAt",
        startedAt,
        "duration",
        `${duration}`,
        "expiresAt",
        expiresAt
      )
      .zadd(MATCH_EXPIRATIONS_KEY, new Date(expiresAt).getTime(), matchId)
      .expire(`${ACTIVE_MATCH_PREFIX}${matchId}`, MATCH_TTL)
      .exec();

    expirationManager.schedule(matchId, duration);
    await workerManager.incrementBusy();

    console.log(
      `Custom match created: ${matchId} with ${uniquePlayers.length} players`
    );

    return {
      matchId,
      hostId,
      participants: uniquePlayers,
      questions: questionPayload,
      startedAt,
      expiresAt,
      duration,
    };
  } catch (err) {
    for (const id of reserved) await redis.del(`${USER_MATCH_PREFIX}${id}`);
    console.error("Custom match creation failed:", err);
    throw err;
  } finally {
    await redis.del(lockKey);
  }
}
