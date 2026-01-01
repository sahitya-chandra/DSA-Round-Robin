import { v4 as uuidv4 } from "uuid";
import prisma from "@repo/db";
import type { Question } from "@repo/db";
import { connection as redis } from "@repo/queue";
import {
  ACTIVE_MATCH_PREFIX,
  USER_MATCH_PREFIX,
  MATCH_DURATION_SECONDS,
  MATCH_TTL,
} from "../utils/constants";

export interface CreatedMatch {
  matchId: string;
  requesterId: string;
  opponentId: string;
  questions: {
    questionData: Question;
    order: number;
  }[];
  startedAt: string;
  expiresAt: string;
  duration: number;
}

function matchKey(a: string, b: string, c: string) {
  return `${[a, b, c].sort().join(":")}`;
}

export async function createMatch(
  requesterId: string,
  opponentId: string
): Promise<CreatedMatch | null> {
  const matchId = matchKey(requesterId, opponentId, uuidv4());
  const lockKey = `${matchId}:lock`;

  const lock = await redis.set(lockKey, "1", "PX", 5000, "NX");
  if (!lock) {
    // Another instance is already creating this match
    return null;
  }

  let keysReserved = false;

  try {
    const existing = await redis.hget(
      `${ACTIVE_MATCH_PREFIX}${matchId}`,
      "status"
    );

    if (existing) {
      return null;
    }

    const reserve = await redis
      .multi()
      .set(
        `${USER_MATCH_PREFIX}${requesterId}`,
        matchId,
        "EX",
        MATCH_TTL,
        "NX"
      )
      .set(
        `${USER_MATCH_PREFIX}${opponentId}`,
        matchId,
        "EX",
        MATCH_TTL,
        "NX"
      )
      .exec();

    if (!reserve || reserve.length < 2) {
        return null;
    }

    const r1 = reserve[0];
    const r2 = reserve[1];

    if (!r1 || !r2) return null;

    const [err1, res1] = r1;
    const [err2, res2] = r2;

    const ok1 = !err1 && res1 === "OK";
    const ok2 = !err2 && res2 === "OK";

    if (!ok1 || !ok2) {
        if (ok1) await redis.del(`${USER_MATCH_PREFIX}${requesterId}`);
        if (ok2) await redis.del(`${USER_MATCH_PREFIX}${opponentId}`);
        return null;
    }

    keysReserved = true;

    const questions = await prisma.$queryRaw<Question[]>`
      SELECT * FROM "Question"
      ORDER BY RANDOM()
      LIMIT 5
    `;

    if (!questions || questions.length === 0) {
      throw new Error("No questions found");
    }

    const questionPayload = questions.map((q, i) => ({
      questionData: q,
      order: i + 1,
    }));

    const startedAt = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + MATCH_DURATION_SECONDS * 1000
    ).toISOString();

    await redis
      .multi()
      .hmset(
        `${ACTIVE_MATCH_PREFIX}${matchId}`,
        "status",
        "RUNNING",
        "requesterId",
        requesterId,
        "opponentId",
        opponentId,
        "questions",
        JSON.stringify(questionPayload),
        "startedAt",
        startedAt,
        "duration",
        `${MATCH_DURATION_SECONDS}`,
        "expiresAt",
        expiresAt
      )
      .expire(`${ACTIVE_MATCH_PREFIX}${matchId}`, MATCH_TTL)
      .exec();

    console.log(`Match created: ${matchId}`);

    return {
      matchId,
      requesterId,
      opponentId,
      questions: questionPayload,
      startedAt,
      expiresAt,
      duration: MATCH_DURATION_SECONDS,
    };
  } catch (err) {
    if (keysReserved) {
        await redis.del(
            `${USER_MATCH_PREFIX}${requesterId}`,
            `${USER_MATCH_PREFIX}${opponentId}`
        );
    }
    console.error("Match creation failed:", err);
    throw err;
  } finally {
    await redis.del(lockKey);
  }
}
